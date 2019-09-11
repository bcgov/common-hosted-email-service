const log = require('npmlog');
const nodemailer = require('nodemailer');
const nunjucks = require('nunjucks');

const utils = require('./utils');

const email = {
  /** Transforms a message object into a nodemailer envelope
   *  @param {object} message An email message object
   *  @returns {object} NodeMailer email envelope object
   */
  createEnvelope: message => {
    const envelope = utils.filterUndefinedAndEmpty(message);
    // Reassign the body field into the type specified by bodyType
    delete Object.assign(envelope, {
      [message.bodyType]: envelope['body']
    })['body'];
    // Remove the bodyType property
    delete envelope['bodyType'];
    return envelope;
  },

  /** Transforms a template into an array of email messages
   *  and sends it to the Ethereal fake SMTP server for viewing
   *  @param {object} template A mail merge template
   *  @returns {string[]} An array of generated Ethereal email urls
   */
  mergeMailEthereal: async template => {
    const messages = email.mergeTemplate(template);

    // Send all mail messages with defined transport object
    const results = await Promise.all(messages.map(message => {
      return email.sendMailEthereal(message);
    }));

    return results;
  },

  /** Transforms a template into an array of email messages
   *  and sends it to the SMTP server
   *  @param {object} template A mail merge template
   *  @returns {object[]} An array of nodemailer result objects
   */
  mergeMailSmtp: async template => {
    const messages = email.mergeTemplate(template);

    // Send all mail messages with defined transport object
    const results = await Promise.all(messages.map(message => {
      return email.sendMailSmtp(message);
    }));

    return results;
  },

  /** Transforms a template into an array of email messages
   *  @param {object} template A mail merge template
   *  @returns {object[]} messages An array of message objects
   */
  mergeTemplate: template => {
    const { body, contexts, subject, ...partialTemplate } = template;

    return contexts.map(entry => {
      return Object.assign({
        body: email.renderMerge(body, entry.context),
        to: entry.to,
        cc: entry.cc,
        bcc: entry.bcc,
        subject: email.renderMerge(subject, entry.context)
      }, partialTemplate);
    });
  },

  /** Applies the context onto the template based on the template dialect
   *  @param {string} template A template string
   *  @param {object} context A key/value object store for template population
   *  @param {string} [dialect=nunjucks] The dialect the `template` string is formatted in
   *  @returns {strong} A rendered merge output
   *  @throws When unsupported `dialect` is used
   */
  renderMerge: (template, context, dialect = 'nunjucks') => {
    if (dialect === 'nunjucks') {
      return nunjucks.renderString(template, context);
    } else {
      throw new Error(`Dialect ${dialect} not supported`);
    }
  },

  /** Sends an email message using the transporter
   *  @param {object} transporter A nodemailer transport object
   *  @param {object} message An email message object
   *  @returns {object} A nodemailer result object
   */
  sendMail: async (transporter, message) => {
    try {
      const envelope = email.createEnvelope(message);

      // Send mail with defined transport object
      const info = await transporter.sendMail(envelope);

      log.debug('sendMail', info);
      return info;
    } catch (error) {
      log.error('sendMail', error.message);
      throw error;
    }
  },

  /** Creates an email and sends it to the Ethereal fake SMTP server for viewing
   *  @param {object} message An email message object
   *  @returns {string} The url of the generated Ethereal email
   */
  sendMailEthereal: async message => {
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

    // Send mail with defined transport object
    const info = await email.sendMail(transporter, message);

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    log.info('Message sent', info.messageId);

    // Preview only available when sending through an Ethereal account
    const testMessageUrl = nodemailer.getTestMessageUrl(info);
    log.info('Preview URL', testMessageUrl);
    return testMessageUrl;
  },

  /** Creates an email and sends it to the SMTP server
   *  @param {object} message An email message object
   *  @returns {object} A nodemailer result object
   */
  sendMailSmtp: async message => {
    // Use the BCGov SMTP server
    const transporter = nodemailer.createTransport({
      host: 'apps.smtp.gov.bc.ca', // TODO: move this to constants file
      port: 25,
      tls: {
        rejectUnauthorized: false // do not fail on invalid certs
      }
    });

    // Send mail with defined transport object
    return await email.sendMail(transporter, message);
  }
};

module.exports = email;
