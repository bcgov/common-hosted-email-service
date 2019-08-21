const log = require('npmlog');
const nodemailer = require('nodemailer');

const utils = require('./utils');

const email = {
  /** Transforms a message object into a nodemailer envelope */
  createEnvelope: message => {
    const envelope = utils.filterUndefinedAndEmpty(message);
    // Reassign the body field into the type specified by bodyType
    delete Object.assign(envelope, {[message.bodyType]: envelope['body'] })['body'];
    // Remove the bodyType property
    delete envelope['bodyType'];
    return envelope;
  },

  /** Creates an email and sends it to the Ethereal fake SMTP server for viewing */
  sendMailEthereal: async message => {
    try {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      const testAccount = await nodemailer.createTestAccount();
      log.debug(utils.prettyStringify(testAccount));

      // Create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const envelope = email.createEnvelope(message);

      // Send mail with defined transport object
      const info = await transporter.sendMail(envelope);

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      log.info('Message sent', info.messageId);
      // Preview only available when sending through an Ethereal account
      log.info('Preview URL', nodemailer.getTestMessageUrl(info));

      return nodemailer.getTestMessageUrl(info);
    } catch (error) {
      log.error('sendMailEthereal', error.message);
      throw error;
    }
  }
};

module.exports = email;
