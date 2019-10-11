const config = require('config');
const nodemailer = require('nodemailer');

let etherealConnection;
let smtpConnection;

class EmailConnection {
  constructor (configuration) {
    this.transporter = nodemailer.createTransport(configuration);
    this.configuration = configuration;
  }
  
  mailer () {
    return this.transporter;
  }
  
  host () {
    try {
      return this.configuration.host;
    } catch(err) {
      return 'unknown';
    }
  }
  
  async verify () {
    return await this.transporter.verify();
  }
  
  getTestMessageUrl (info) {
    // this will only work if the transporter is ethereal...
    try {
      return nodemailer.getTestMessageUrl(info);
      // eslint-disable-next-line no-empty
    } catch (err) {
    
    }
  }
}

class EmailConnectionFactory {
  
  static getSmtpConnection () {
    if (!smtpConnection) {
      const configuration = {
        host: config.get('server.smtpHost'),
        port: 25,
        tls: {
          rejectUnauthorized: false // do not fail on invalid certs
        }
      };
      smtpConnection = new EmailConnection(configuration);
    }
    return smtpConnection;
  }
  
  static async getEtherealConnection () {
    if (!etherealConnection) {
      const testAccount = await nodemailer.createTestAccount();
      const configuration = {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      };
      // eslint-disable-next-line require-atomic-updates
      etherealConnection = new EmailConnection(configuration);
    }
    return etherealConnection;
  }
  
}

module.exports = { EmailConnectionFactory, EmailConnection };
