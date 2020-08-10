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
const log = require('npmlog');
const openpgpEncrypt = require('nodemailer-openpgp').openpgpEncrypt;

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

  /** @function connection
   *  Gets the current EmailConnection
   */
  get connection() {
    return this._connection;
  }

  /** @function connection
   *  Sets the current EmailConnection
   *  @param {object} v - an EmailConnection
   */
  set connection(v) {
    this._connection = v;
  }

  /** Create a nodemailer envelope from a Message
   *  @param {object} message - a Message (email)
   *  @returns {object} - the nodemailer message
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

  /** Delivers mail object through specified mailer
   *  Uses SMTP by default
   *  @param {object} mailer - a nodemailer transport
   *  @param {object} message - the nodemailer message
   */
  async sendMail(mailer, message) {
    try {
      const envelope = this.createEnvelope(message);

      // Add PGP Encryption stream plugin if necessary
      if (envelope.encryptionKeys) {
        mailer.use('stream', openpgpEncrypt({
          signingKey: [envelope.signingKey],
          passphrase: envelope.signingKeyPassphrase
        }));
      }

      // Send mail with defined transport object
      const info = await mailer.sendMail(envelope);

      log.debug('sendMail', info);
      return info;
    } catch (error) {
      log.error('sendMail', error.message);
      throw error;
    }
  }

  /** Creates an email and sends it...
   *  Uses SMTP by default
   *  @param {object} message An email message object
   *  @param {boolean} ethereal - when true, send to Ethereal service (good for local testing)
   *  @returns {object} A nodemailer result object
   */
  async send(message, ethereal = false) {
    if (ethereal) {
      const etherealConnection = await EmailConnection.getEtherealConnection();
      const info = await this.sendMail(etherealConnection.mailer, message);
      const url = etherealConnection.getTestMessageUrl(info);
      log.info(`Ethereal test url = ${url}`);
      return url;
    }
    return await this.sendMail(this.connection.mailer, message);
  }
}

module.exports = EmailService;
