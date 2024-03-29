/**
 * @module EmailService
 *
 * Service to send email.
 * Uses an SMTP server by default, can send to Ethereal.
 *
 *
 * @see EmailConnection
 * @see NodeMailer
 *
 * @exports EmailService
 */
const log = require('../components/log')(module.filename);

const utils = require('../components/utils');

const EmailConnection = require('./emailConn');

class EmailService {
  /**
   * Creates a new EmailService with default connection.
   * @class
   */
  constructor() {
    this.connection = new EmailConnection();
  }

  /**
   * @function connection
   * Gets the current EmailConnection
   */
  get connection() {
    return this._connection;
  }

  /**
   * @function connection
   * Sets the current EmailConnection
   * @param {object} v - an EmailConnection
   */
  set connection(v) {
    this._connection = v;
  }

  /**
   * Create a nodemailer envelope from a Message
   * @param {object} message - a Message (email)
   * @returns {object} - the nodemailer message
   */
  createEnvelope(message) {
    const envelope = utils.filterUndefinedAndEmptyArray(message);
    // Reassign the body field into the type specified by bodyType
    delete Object.assign(envelope, {
      [message.bodyType]: envelope['body']
    })['body'];
    // Remove the bodyType property
    delete envelope['bodyType'];
    return envelope;
  }

  /**
   * Delivers mail object through specified mailer
   * Uses SMTP by default
   * @param {object} mailer - a nodemailer transport
   * @param {object} message - the nodemailer message
   */
  async sendMail(mailer, message) {
    try {
      if (!message) throw new Error('Message is missing email contents');
      const envelope = this.createEnvelope(message);

      // Send mail with defined transport object
      const info = await mailer.sendMail(envelope);

      log.debug(info, { function: 'sendMail' });
      return info;
    } catch (error) {
      log.error(error.message, { function: 'sendMail' });
      throw error;
    }
  }

  /**
   * Creates an email and sends it...
   * Uses SMTP by default
   * @param {object} message An email message object
   * @param {boolean} pooledMode Uses pooled mailer when true
   * @param {boolean} [ethereal=false] Send to Ethereal service when true (good for local testing)
   * @returns {object} A nodemailer result object
   */
  async send(message, pooledMode, ethereal = false) {
    if (ethereal) {
      const etherealConnection = await EmailConnection.getEtherealConnection();
      const info = await this.sendMail(etherealConnection.mailer, message);
      const url = etherealConnection.getTestMessageUrl(info);
      log.info(`Ethereal test url = ${url}`, { function: 'send' });
      return url;
    }

    const mailer = (pooledMode) ? this.connection.pooledMailer : this.connection.singleMailer;
    return this.sendMail(mailer, message);
  }
}

module.exports = EmailService;
