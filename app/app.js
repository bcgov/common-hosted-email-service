const config = require('config');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');
const Problem = require('api-problem');

const utils = require('./src/components/utils');
const v1Router = require('./src/routes/v1');

const apiRouter = express.Router();
const state = {
  isShutdown: false
};

const app = express();
app.use(express.json());
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
}

// GetOK Base API Directory
apiRouter.get('/', (_req, res) => {
  if (!state.isShutdown) {
    new Problem(500).send(res, {
      detail: 'Server shutting down'
    });
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

// Root level Router
app.use(/(\/api)?/, apiRouter);

// v1 Router
apiRouter.use('/v1', v1Router);

// Handle 500
app.use((err, _req, res, next) => {
  if (err.stack) {
    log.error(err.stack);
  }

  if (err instanceof Problem) {
    err.send(res);
  } else {
    const details = {};
    if (err.message) {
      details.detail = err.message;
    } else {
      details.detail = err;
    }

    new Problem(500, details).send(res);
  }

  next();
});

// Handle 404
app.use((_req, res) => {
  new Problem(404).send(res);
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  if (err.stack) {
    log.error(err.stack);
  }
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  log.info('Received kill signal. Shutting down...');
  state.isShutdown = true;
  // Wait 3 seconds before hard exiting
  setTimeout(() => process.exit(), 3000);
}

module.exports = app;
