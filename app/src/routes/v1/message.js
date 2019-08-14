const log = require('npmlog');
const message = require('express').Router();
const nodemailer = require('nodemailer');

// pushes a message
message.post('/message', async (req, res) => {
  try {
    const recipients = req.body.recipients.join(', ');
    const sender = '"Common Service Showcase 🦜" <NR.CommonServiceShowcase@gov.bc.ca>';

    if (req.body.devMode) {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      const testAccount = await nodemailer.createTestAccount();
      log.debug(testAccount);

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
        subject: req.body.subject, // Subject line
        text: req.body.text, // plain text body
        html: req.body.html
      });

      log.info('Message sent: %s', info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

      // Preview only available when sending through an Ethereal account
      log.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      res.send(nodemailer.getTestMessageUrl(info));
    } else {
      // Use the bc gov smtp server
      const transporter = nodemailer.createTransport({
        host: 'apps.smtp.gov.bc.ca',
        port: 25,
        tls: {
          rejectUnauthorized: false // do not fail on invalid certs
        }
      });

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: sender, // sender address
        to: recipients, // list of receivers
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

      log.debug(info);
      res.status(200).send(info);
    }
  } catch (error) {
    log.error(error);
  }
});

module.exports = message;
