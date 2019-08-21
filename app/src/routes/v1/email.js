const log = require('npmlog');
const emailRouter = require('express').Router();
const nodemailer = require('nodemailer');
const Problem = require('api-problem');
const {
  body,
  validationResult
} = require('express-validator');

// eslint-disable-next-line no-unused-vars
const emailComponent = require('../../components/email');
const utils = require('../../components/utils');

// pushes a message
emailRouter.post('/', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('from').isString(),
  body('to').isArray(),
  body('subject').isString()
], async (req, res) => {
  // Validate for Bad Requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new Problem(400, {
      detail: 'Validation failed',
      errors: errors.array()
    }).send(res);
  }

  try {
    // const recipients = req.body.recipients.join(', ');
    // const sender = '"Common Service Showcase 🦜" <NR.CommonServiceShowcase@gov.bc.ca>';

    if (req.body.devMode) {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      const testAccount = await nodemailer.createTestAccount();
      log.debug(utils.prettyStringify(testAccount));

      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const envelope = {
        from: req.body.from,
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.body
      };

      // send mail with defined transport object
      const info = await transporter.sendMail(envelope);

      log.info('Message sent', info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      log.info('Preview URL', nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      res.status(200).send(nodemailer.getTestMessageUrl(info));
    } else {
      res.status(200).end();
    }
  } catch (error) {
    log.error(error.message);
    new Problem(502, {
      detail: error.message
    }).send(res);
  }
});

emailRouter.post('/merge', async (_req, res) => {
  new Problem(501).send(res);
});

emailRouter.post('/merge/preview', async (_req, res) => {
  new Problem(501).send(res);
});

module.exports = emailRouter;
