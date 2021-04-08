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
const log = require('npmlog');

/**
 * Base configuration object for Nodemailer
 */
const baseNodemailerConfig = {
  host: config.get('server.smtpHost'),
  port: 25,
  tls: {
    rejectUnauthorized: false // do not fail on invalid certs
  },
  connectionTimeout: 10 * 1000 // Timeout SMTP connection attempt after 10 seconds
};

let etherealConnection;

class EmailConnection {
  /**
   * Creates a new EmailConnection with default (SMTP) configuration.
   * @class
   */
  constructor() {
    /**
     * Configuration object for pooled Nodemailer
     */
    const pooledNodemailerConfig = Object.assign({
      pool: true, // Use pooled email connections to reduce TCP network churn
      maxConnections: 1, // Cap max SMTP connections in pool to one (we dispatch sequentially via Redis queue),
      // Ref `Connection inactivity time`: https://docs.microsoft.com/en-us/exchange/mail-flow/message-rate-limits?view=exchserver-2019#message-throttling-on-receive-connectors
      socketTimeout: 30 * 1000 // Close SMTP connection after 30 seconds of inactivity
    }, baseNodemailerConfig);

    if (!EmailConnection.instance) {
      this.pooledMailer = nodemailer.createTransport(pooledNodemailerConfig);
      this.singleMailer = nodemailer.createTransport(baseNodemailerConfig);
      EmailConnection.instance = this;
    }

    return EmailConnection.instance;
  }

  /**
   * @function connected
   * True or false if connected.
   */
  get connected() {
    return this._connected;
  }

  /**
   * @function singleMailer
   * Get the current single nodemailer transport
   */
  get singleMailer() {
    return this._singleMailer;
  }

  /**
   * @function singleMailer
   * Sets the underlying single nodemailer transport
   * @param {object} v - a new nodemailer instance
   */
  set singleMailer(v) {
    this._singleMailer = v;
  }

  /**
   * @function pooledMailer
   * Get the current pooled nodemailer transport
   */
  get pooledMailer() {
    return this._pooledMailer;
  }

  /**
   * @function pooledMailer
   * Sets the underlying pooled nodemailer transport
   * @param {object} v - a new nodemailer instance
   */
  set pooledMailer(v) {
    this._connected = false;
    this._pooledMailer = v;
  }

  /**
   * @function getEtherealConnection
   * Gets a connection to Ethereal
   * Should only be used for local development/testing
   */
  static async getEtherealConnection() {
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

  /**
   * @function getTestMessageUrl
   * Gets a test url for Ethereal
   * Should only be used for local development/testing
   */
  getTestMessageUrl(info) {
    // this will only work if the transporter is ethereal...
    try {
      return nodemailer.getTestMessageUrl(info);
      // eslint-disable-next-line no-empty
    } catch (err) {

    }
  }

  /**
   * @function checkConnection
   * Checks the current node mailer connection.
   */
  async checkConnection() {
    this._connected = await this.pooledMailer.verify();
    return this.connected;
  }

  /**
   * @function close
   * Will close the EmailConnection
   */
  close() {
    try {
      if (this.pooledMailer) this.pooledMailer.close();
      if (this.singleMailer) this.singleMailer.close();
      this._connected = false;
      log.info('EmailConnection.close', 'Disconnected');
    } catch (e) {
      log.error(e);
    }
  }
}

module.exports = EmailConnection;
