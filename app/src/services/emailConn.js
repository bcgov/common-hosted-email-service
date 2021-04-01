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
  constructor() {
    /**
     * Configuration object for Nodemailer
     */
    const nodeMailerConfig = {
      host: config.get('server.smtpHost'),
      port: 25,
      tls: {
        rejectUnauthorized: false // do not fail on invalid certs
      },
      pool: true, // Use pooled email connections to reduce TCP network churn
      maxConnections: 1, // Cap max SMTP connections in pool to one (we dispatch sequentially via Redis queue),
      connectionTimeout: 10 * 1000, // Timeout SMTP connection attempt after 10 seconds
      // Ref `Connection inactivity time`: https://docs.microsoft.com/en-us/exchange/mail-flow/message-rate-limits?view=exchserver-2019#message-throttling-on-receive-connectors
      socketTimeout: 30 * 1000 // Close SMTP connection after 30 seconds of inactivity
    };

    if (!EmailConnection.instance) {
      this.mailer = nodemailer.createTransport(nodeMailerConfig);
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
   * @function mailer
   * Get the current nodemailer transport
   */
  get mailer() {
    return this._mailer;
  }

  /**
   * @function mailer
   * Sets the underlying nodemailer transport
   * @param {object} v - a new nodemailer instance
   */
  set mailer(v) {
    this._connected = false;
    this._mailer = v;
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
    this._connected = await this.mailer.verify();
    return this.connected;
  }
}

module.exports = EmailConnection;
