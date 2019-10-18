/**
 * @module EmailConnection
 *
 * Create and check the connection for an email transport.
 * Default is SMTP.
 *
 * @see EmailService
 *
 * @see NodeMailer
 *
 * @exports EmailConnection
 */
const config = require('config');
const nodemailer = require('nodemailer');

let etherealConnection;

class EmailConnection {
  /**
   * Creates a new EmailConnection with default (SMTP) configuration.
   * @class
   */
  constructor () {
    this.configuration = {
      host: config.get('server.smtpHost'),
      port: 25,
      tls: {
        rejectUnauthorized: false // do not fail on invalid certs
      }
    };
  }

  /** @function configuration
   *  Gets the current configuration
   */
  get configuration () {
    return this._configuration;
  }

  /** @function configuration
   *  Sets the current configuration
   *  @param {object} v - a node mailer transport configuration.
   */
  set configuration (v) {
    this._configuration = v;
    this._mailer = nodemailer.createTransport(this._configuration);
    this._connected = false;
  }

  /** @function connected
   *  True or false if connected.
   */
  get connected () {
    return this._connected;
  }

  /** @function mailer
   *  Get the current nodemailer transport
   */
  get mailer () {
    return this._mailer;
  }

  /** @function host
   *  Get the current host name for the connection
   */
  get host () {
    try {
      return this._configuration.host;
    } catch (err) {
      return 'unknown';
    }
  }

  /** @function getEtherealConnection
   *  Gets a connection to Ethereal
   *  Should only be used for local development/testing
   */
  static async getEtherealConnection () {
    if (!etherealConnection) {
      const testAccount = await nodemailer.createTestAccount();
      const etherealConfiguration = {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      };
      // eslint-disable-next-line require-atomic-updates
      etherealConnection = new EmailConnection();
      // eslint-disable-next-line require-atomic-updates
      etherealConnection.configuration = etherealConfiguration;
    }
    return etherealConnection;
  }

  /** @function getTestMessageUrl
   *  Gets a test url for Ethereal
   *  Should only be used for local development/testing
   */
  getTestMessageUrl (info) {
    // this will only work if the transporter is ethereal...
    try {
      return nodemailer.getTestMessageUrl(info);
      // eslint-disable-next-line no-empty
    } catch (err) {

    }
  }

  /** @function checkConnection
   *  Checks the current node mailer connection.
   */
  async checkConnection () {
    this._connected = await this._mailer.verify();
    return this._connected;
  }

}

module.exports = EmailConnection;
