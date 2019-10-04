const compression = require('compression');
const config = require('config');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');
const Problem = require('api-problem');

const keycloak = require('./src/components/keycloak');
const { queue } = require('./src/components/queue');
const utils = require('./src/components/utils');
const v1Router = require('./src/routes/v1');

const apiRouter = express.Router();
const state = {
  isRedisConnected: false,
  isShutdown: false
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
log.debug('Config', utils.prettyStringify(config));

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  // Add Morgan endpoint logging
  app.use(morgan(config.get('server.morganFormat')));

  // Check database connection and exit if unsuccessful
  (async () => {
    const { Client } = require('pg');

    const client = new Client({
      user: config.get('db.username'),
      host: config.get('db.host'),
      database: config.get('db.database'),
      password: config.get('db.password')
    });
    try {
      await client.connect();
      await client.query('SELECT 1+1 AS result');
      log.info('Connected to Database');
      client.end();
    } catch (error) {
      log.error('Unable to connect to Database...');
      client.end();
      shutdown();
    }
  })();

  // Check Redis connection
  (async (connected) => {
    for (let i = 0; i < 5; i++) {
      if (queue.clients[0].status === 'ready') {
        state.isRedisConnected = true;
        log.info('Connected to Redis');
        return;
      }

      await utils.wait(1000);
    }

    if (!connected) {
      log.error('Unable to connect to Redis...');
      shutdown();
    }
  })(state.isRedisConnected);
}

// Use Keycloak OIDC Middleware
app.use(keycloak.middleware());

// GetOK Base API Directory
apiRouter.get('/', (_req, res) => {
  if (state.isShutdown) {
    throw new Error('Server shutting down');
  } else if (!state.isRedisConnected) {
    throw new Error('Server not connected to Redis');
  } else {
    res.status(200).json({
      endpoints: [
        '/api/v1'
      ],
      versions: [
        1
      ]
    });
  }
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

function shutdown() {
  log.info('Received kill signal. Shutting down...');
  state.isShutdown = true;
  queue.close();
  // Wait 3 seconds before hard exiting
  setTimeout(() => process.exit(), 3000);
}

module.exports = app;
