const config = require('config');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');
const nodemailer = require('nodemailer');

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
  if(state.isShutdown) {
    res.status(500).end('not ok');
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

apiRouter.post('/message', async (req, res) => {
  try {

    console.log('POSTED message');

    const recips = req.body.recipients.join(', ');
    const sender = '"Common Service Showcase 🦜" <NR.CommonServiceShowcase@gov.bc.ca>';

    if (req.body.devMode) {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      let testAccount = await nodemailer.createTestAccount();
      console.log(testAccount.user);
      console.log(testAccount.pass);
      console.log(testAccount.smtp.host);
      console.log(testAccount.smtp.port);
      console.log(testAccount.smtp.secure);

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: sender, // sender address
        to: recips, // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.text, // plain text body
        html: req.body.html
      });

      console.log('Message sent: %s', info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      res.send(nodemailer.getTestMessageUrl(info));
    } else {
      // Use the bc gov smtp server
      let transporter = nodemailer.createTransport({
        host: 'apps.smtp.gov.bc.ca',
        port: 25,
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: sender, // sender address
        to: recips, // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.text, // plain text body
        html: req.body.html,
        attachments: req.body.attachments,
        dsn: {
          id: 'some random message specific id',
          return: 'headers',
          notify: 'success',
          recipient: 'NR.CommonServiceShowcase@gov.bc.ca'
        }
      });

      console.log(info);
      res.send(info);
    }

  } catch (error) {
    console.log(error);
  }
});

// GetOK Base API Directory
apiRouter.get('/', (_req, res) => {
  if(state.isShutdown) {
    res.status(500).end('not ok');
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
  console.log(err.stack);
  res.status(500).json({
    status: 500,
    message: 'Internal Server Error: ' + err.stack.split('\n', 1)[0]
  });
  next();
});

// Handle 404
app.use((_req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Page Not Found'
  });
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  log.error(err.stack);
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
