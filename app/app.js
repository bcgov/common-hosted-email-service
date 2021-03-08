const compression = require('compression');
const config = require('config');
const express = require('express');
const log = require('npmlog');
const moment = require('moment');
const morgan = require('morgan');
const Problem = require('api-problem');

const keycloak = require('./src/components/keycloak');
const stackpole = require('./src/components/stackpole');
const transformer = require('./src/components/transformer');
const utils = require('./src/components/utils');
const v1Router = require('./src/routes/v1');

const { authorizedParty } = require('./src/middleware/authorizedParty');
const initializeMailApiTracker = require('./src/middleware/mailApiTracker');

const DataConnection = require('./src/services/dataConn');
const EmailConnection = require('./src/services/emailConn');
const QueueConnection = require('./src/services/queueConn');
const QueueListener = require('./src/services/queueListener');
const StatisticsService = require('./src/services/statisticSvc');

const apiRouter = express.Router();
const state = {
  connections: {
    data: false,
    email: true, // Assume SMTP is accessible by default
    queue: false
  },
  mounted: false,
  ready: false,
  shutdown: false
};

const app = express();
app.use(compression());
app.use(express.json({
  limit: config.get('server.bodyLimit')
}));
app.use(express.urlencoded({
  extended: false
}));

// Logging Setup
log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, {
  fg: 'cyan'
});

// Print out configuration settings in verbose startup
log.verbose('Config', utils.prettyStringify(config));

// this will suppress a console warning about moment deprecating a default fallback on non ISO/RFC2822 date formats
// we will just force it to use the new Date constructor.
moment.createFromInputFallback = config => {
  config._d = new Date(config._i);
};

// Instantiate application level connection objects
const dataConnection = new DataConnection();
const queueConnection = new QueueConnection();
const emailConnection = new EmailConnection();

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  // make sure authorized party middleware loaded before the mail api tracking...
  app.use(authorizedParty);
  initializeMailApiTracker(app);
  // load up morgan to log the requests
  app.use(morgan(config.get('server.morganFormat')));
  // Initialize connections and exit if unsuccessful
  initializeConnections();
}

// Use Keycloak OIDC Middleware
app.use(keycloak.middleware());

// Block requests until service is ready and mounted
app.use((_req, res, next) => {
  if (state.shutdown) {
    throw new Error('Server shutting down');
  } else if (!state.ready || !state.mounted) {
    new Problem(503, { details: 'Server is not ready' }).send(res);
  } else {
    next();
  }
});

// GetOK Base API Directory
apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/api/v1'
    ],
    versions: [
      1
    ]
  });
});

// v1 Router
apiRouter.use('/v1', v1Router);

// Root level Router
app.use(/(\/api)?/, apiRouter);

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.stack) {
    log.error(err.stack);
  }

  if (err instanceof Problem) {
    err.send(res);
  } else {
    new Problem(500, {
      details: (err.message) ? err.message : err
    }).send(res);
  }
});

// Handle 404
app.use((_req, res) => {
  new Problem(404).send(res);
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  if (err && err.stack) {
    log.error(err.stack);
  }
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 *  @function shutdown
 *  Begins shutting down this application. It will hard exit after 3 seconds.
 */
function shutdown() {
  log.info('Received kill signal. Shutting down...');
  state.shutdown = true;
  QueueConnection.close();
  // Wait 3 seconds before hard exiting
  setTimeout(() => process.exit(), 3000);
}

/**
 *  @function initializeConnections
 *  Initializes the database, queue and email connections
 *  This will force the application to exit if it fails
 */
function initializeConnections() {
  // Initialize connections and exit if unsuccessful
  try {
    const tasks = [
      dataConnection.checkAll(),
      queueConnection.checkConnection()
    ];

    if (process.env.NODE_ENV == 'production') {
      tasks.push(emailConnection.checkConnection());
    }

    Promise.all(tasks)
      .then(results => {
        state.connections.data = results[0];
        state.connections.queue = results[1];
        if (results[2] !== undefined) {
          state.connections.email = results[2];
        }

        if (state.connections.data) log.info('DataConnection', 'Connected');
        if (state.connections.queue) log.info('QueueConnection', 'Connected');
        if (state.connections.email) log.info('EmailConnection', 'Connected');
      })
      .catch(error => {
        log.error(error);
        log.error('initializeConnections', `Initialization failed: Database OK = ${state.connections.data}, Queue OK = ${state.connections.queue}, Email OK = ${state.connections.email}`);
      })
      .finally(() => {
        state.ready = Object.values(state.connections).every(x => x);
        if (!state.ready) shutdown();
        mountServices();
      });

  } catch (error) {
    log.error('initializeConnections', 'Connection initialization failure', error.message);
    if (!state.ready) shutdown();
  }

  // Start asynchronous connection probe
  connectionProbe();
}

/**
 *  @function connectionProbe
 *  Periodically checks the status of the connections at a specific interval
 *  This will force the application to exit a connection fails
 *  @param {integer} [interval=10000] Number of milliseconds to wait before
 */
function connectionProbe(interval = 10000) {
  const checkConnections = () => {
    if (!state.shutdown) {
      const tasks = [
        dataConnection.checkConnection(),
        queueConnection.checkConnection()
      ];

      log.verbose(JSON.stringify(state));
      Promise.all(tasks).then(results => {
        state.connections.data = results[0];
        state.connections.queue = results[1];
        state.ready = Object.values(state.connections).every(x => x);
        if (!state.ready) shutdown();
      });
    }
  };

  setInterval(checkConnections, interval);
}

/**
 *  @function mountServices
 *  Registers the queue listener workers and stackpole services
 */
function mountServices() {
  if (state.ready && !state.mounted) {
    // Register the listener worker when everything is connected
    queueConnection.queue.process(QueueListener.onProcess);
    queueConnection.queue.on('completed', QueueListener.onCompleted);
    queueConnection.queue.on('error', QueueListener.onError);
    queueConnection.queue.on('failed', QueueListener.onFailed);
    log.debug('QueueConnection', 'Listener workers attached');

    // StackpoleService requires the data connection created and initialized...
    // since it is, let's hook in the write statistic
    const writeFn = new StatisticsService().write;
    stackpole.register('mailStats', writeFn, transformer.mailApiToStatistics);
    stackpole.register('createTransaction', writeFn, transformer.transactionToStatistics);
    stackpole.register('updateStatus', writeFn, transformer.messageToStatistics);
    log.debug('StatisticsService', 'Stackpole registered');

    state.mounted = true;
  }
}

module.exports = app;
