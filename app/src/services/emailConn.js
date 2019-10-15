const config = require('config');
const nodemailer = require('nodemailer');

let etherealConnection;

class EmailConnection {
  
  constructor () {
    this.configuration = {
      host: config.get('server.smtpHost'),
      port: 25,
      tls: {
        rejectUnauthorized: false // do not fail on invalid certs
      }
    };
  }
  
  get configuration () {
    return this._configuration;
  }
  
  set configuration (v) {
    this._configuration = v;
    this._mailer = nodemailer.createTransport(this._configuration);
    this._connected = false;
  }
  
  get connected () {
    return this._connected;
  }
  
  get mailer () {
    return this._mailer;
  }
  
  get host () {
    try {
      return this._configuration.host;
    } catch (err) {
      return 'unknown';
    }
  }
  
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
  
  getTestMessageUrl (info) {
    // this will only work if the transporter is ethereal...
    try {
      return nodemailer.getTestMessageUrl(info);
      // eslint-disable-next-line no-empty
    } catch (err) {
    
    }
  }
  
  async checkConnection () {
    this._connected = await this._mailer.verify();
    return this._connected;
  }
  
}

module.exports = EmailConnection;
