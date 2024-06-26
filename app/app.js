const Problem = require('api-problem');
const compression = require('compression');
const config = require('config');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const moment = require('moment');

const { name: appName, version: appVersion } = require('./package.json');
const log = require('./src/components/log')(module.filename);
const httpLogger = require('./src/components/log').httpLogger;
const { getGitRevision } = require('./src/components/utils');

const { authorizedParty } = require('./src/middleware/authorizedParty');
const v1Router = require('./src/routes/v1');

const DataConnection = require('./src/services/dataConn');
const EmailConnection = require('./src/services/emailConn');
const QueueConnection = require('./src/services/queueConn');
const QueueListener = require('./src/services/queueListener');

const apiRouter = express.Router();
const state = {
  connections: {
    data: false,
    email: true, // Assume SMTP is accessible by default
    queue: false
  },
  gitRev: getGitRevision(),
  mounted: false,
  ready: false,
  shutdown: false
};
let probeId;

const app = express();
app.use(compression());
app.use(cors({
  /** Tells browsers to cache preflight requests for Access-Control-Max-Age seconds */
  maxAge: 600,
  /** Set true to dynamically set Access-Control-Allow-Origin based on Origin */
  origin: true
}));
app.use(express.json({ limit: config.get('server.bodyLimit') }));
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

// Print out configuration settings in verbose startup
log.verbose('Config', { config: config });

// Suppresses warning about moment deprecating a default fallback on non ISO/RFC2822 date formats
// We will just force it to use the new Date constructor - https://stackoverflow.com/a/34521624
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
  // Initialize connections and exit if unsuccessful
  initializeConnections();
  app.use(httpLogger);
}

// Block requests until service is ready and mounted
app.use((_req, res, next) => {
  if (state.shutdown) {
    new Problem(503, { details: 'Server is shutting down' }).send(res);
  } else if (!state.ready || !state.mounted) {
    new Problem(503, { details: 'Server is not ready' }).send(res);
  } else {
    next();
  }
});

// GetOK Base API Directory
apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    app: {
      authMode: state.authMode,
      gitRev: state.gitRev,
      name: appName,
      nodeVersion: process.version,
      version: appVersion
    },
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

// Handle 404
app.use((req, res) => {
  new Problem(404, { instance: req.originalUrl }).send(res);
});

// Handle Problem Responses
app.use((err, req, res, _next) => { // eslint-disable-line no-unused-vars
  if (err instanceof Problem) {
    // Attempt to reset DB connection if 5xx error
    if (err.status >= 500 && !state.shutdown) dataConnection.resetConnection();
    err.send(res);
  } else {
    // Attempt to reset DB connection
    if (!state.shutdown) dataConnection.resetConnection();
    if (err.stack) log.error(err); // Only log unexpected errors
    new Problem(500, { detail: err.message ?? err, instance: req.originalUrl }).send(res);
  }
});

// Ensure unhandled errors gracefully shut down the application
process.on('unhandledRejection', err => {
  log.error(`Unhandled Rejection: ${err.message ?? err}`, { function: 'onUnhandledRejection' });
  fatalErrorHandler();
});
process.on('uncaughtException', err => {
  log.error(`Unhandled Exception: ${err.message ?? err}`, { function: 'onUncaughtException' });
  fatalErrorHandler();
});

// Graceful shutdown support
['SIGHUP', 'SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGUSR1', 'SIGUSR2']
  .forEach(signal => process.on(signal, shutdown));
process.on('exit', code => {
  log.info(`Exiting with code ${code}`, { function: 'onExit' });
});

/**
 * @function shutdown
 * Shuts down this application after at least 5 seconds.
 */
function shutdown() {
  log.info('Received kill signal. Shutting down...', { function: 'shutdown' });
  state.shutdown = true;
  log.info('Service no longer accepting traffic', { function: 'shutdown' });
  queueConnection.pause();

  // Wait 5 seconds before starting cleanup
  setTimeout(cleanup, 5000);
}

/**
 * @function cleanup
 * Cleans up connections in this application.
 */
function cleanup() {
  log.info('Cleaning up...', { function: 'cleanup' });
  clearInterval(probeId);

  queueConnection.close(() => {
    emailConnection.close(() => {
      dataConnection.close(() => {
        process.exit();
      });
    });
  });

  // Wait 10 seconds max before hard exiting
  setTimeout(() => process.exit(), 10000);
}

/**
 * @function fatalErrorHandler
 * Forces the application to shutdown
 */
function fatalErrorHandler() {
  process.exitCode = 1;
  shutdown();
}

/**
 * @function initializeConnections
 * Initializes the database, queue and email connections
 * This will force the application to exit if it fails
 */
function initializeConnections() {
  // Initialize connections and exit if unsuccessful
  try {
    const tasks = [
      dataConnection.checkAll(),
      queueConnection.checkReachable()
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
      })
      .catch(error => {
        log.error(error.message, { function: 'initializeConnections' });
      })
      .finally(() => {
        log.info(`Connection Statuses: Database = ${state.connections.data}, Queue = ${state.connections.queue}, Email = ${state.connections.email}`, { connections: state.connections, function: 'initializeConnections' });
        state.ready = Object.values(state.connections).every(x => x);

        if (state.connections.queue) mountServices();
        else {
          log.error('Queue failed to initialize', { function: 'initializeConnections' });
          process.exitCode = 1;
          shutdown();
        }
      });
  } catch (error) {
    log.error('Connection initialization failure', error.message, { function: 'initializeConnections' });
    if (!state.ready) {
      process.exitCode = 1;
      shutdown();
    }
  }

  // Start periodic 10 second connection probe check
  probeId = setInterval(checkConnections, 10000);
}

/**
 * @function checkConnections
 * Checks Database and Redis connectivity
 * This will force the application to exit if a connection fails
 */
function checkConnections() {
  const wasMounted = state.mounted;
  if (!state.shutdown) {
    const tasks = [
      dataConnection.checkConnection(),
      queueConnection.checkConnection()
    ];

    Promise.all(tasks).then(results => {
      state.connections.data = results[0];
      state.connections.queue = results[1];
      state.ready = Object.values(state.connections).every(x => x);
      state.mounted = results[1];
      if (!wasMounted && state.mounted && state.ready) log.info('Service ready to accept traffic', { function: 'checkConnections' });
      log.verbose('State', { function: 'initializeConnections', state: state });
      if (!state.ready) {
        process.exitCode = 1;
        shutdown();
      }
    });
  }
}

/**
 * @function mountServices
 * Registers the queue listener workers
 */
function mountServices() {
  // Register the listener worker when everything is connected
  queueConnection.queue.process(QueueListener.onProcess);
  queueConnection.queue.on('completed', QueueListener.onCompleted);
  queueConnection.queue.on('error', QueueListener.onError);
  queueConnection.queue.on('failed', QueueListener.onFailed);
  queueConnection.queue.on('drained', QueueListener.onDrained);
  queueConnection.queue.on('removed', QueueListener.onRemoved);
  log.verbose('Listener workers attached', { function: 'mountServices' });
  log.info('Start accepting new jobs', { function: 'mountServices' });
}

module.exports = app;
