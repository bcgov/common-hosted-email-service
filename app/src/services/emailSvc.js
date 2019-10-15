const log = require('npmlog');

const utils = require('../components/utils');

const EmailConnection = require('./emailConn');

class EmailService {
  
  constructor () {
    this.connection = new EmailConnection();
  }
  
  get connection () {
    return this._connection;
  }
  
  set connection (v) {
    this._connection = v;
  }
  
  createEnvelope (message) {
    const envelope = utils.filterUndefinedAndEmpty(message);
    // Reassign the body field into the type specified by bodyType
    delete Object.assign(envelope, {
      [message.bodyType]: envelope['body']
    })['body'];
    // Remove the bodyType property
    delete envelope['bodyType'];
    return envelope;
  }
  
  async sendMail (mailer, message) {
    try {
      const envelope = this.createEnvelope(message);
      
      // Send mail with defined transport object
      const info = await mailer.sendMail(envelope);
      
      log.debug('sendMail', info);
      return info;
    } catch (error) {
      log.error('sendMail', error.message);
      throw error;
    }
  }
  
  /** Creates an email and sends it to the SMTP server
   *  @param {object} message An email message object
   *  @returns {object} A nodemailer result object
   */
  async send (message, ethereal = false) {
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
