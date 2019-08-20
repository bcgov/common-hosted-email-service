const log = require('npmlog');
const email = require('express').Router();
const nodemailer = require('nodemailer');
const nunjucks = require('nunjucks');
const Problem = require('api-problem');

const utils = require('../../components/utils');

// pushes a message
email.post('/', async (req, res) => {
  try {
    const recipients = req.body.recipients.join(', ');
    const sender = '"Common Service Showcase 🦜" <NR.CommonServiceShowcase@gov.bc.ca>';

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

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: sender, // sender address
        to: recipients, // list of receivers
        subject: nunjucks.renderString(req.body.subject, req.body.data), // Subject line
        text: nunjucks.renderString(req.body.text, req.body.data), // plain text body
        html: nunjucks.renderString(req.body.html, req.body.data)
      });

      log.info('Message sent', info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      log.info('Preview URL', nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      res.status(200).send(nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    log.error(error.message);
  }
});

email.post('/merge', async (_req, res) => {
  new Problem(501).send(res);
});

email.post('/merge/preview', async (_req, res) => {
  new Problem(501).send(res);
});

module.exports = email;
