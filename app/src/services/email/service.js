const log = require('npmlog');

const { EmailConnectionFactory } = require('./connection');

const utils = require('../../components/utils');

let emailService;

class EmailService {
  
  constructor (connection) {
    this.connection = connection;
    this.mailer = connection.mailer();
  }
  
  /** Creates an email and sends it to the SMTP server
   *  @param {object} message An email message object
   *  @returns {object} A nodemailer result object
   */
  async sendMail (message, ethereal = false) {
    if (ethereal) {
      const info = await EmailSender.sendMail(this.mailer, message);
      const url = this.connection.getTestMessageUrl(info);
      log.info(`Ethereal test url = ${url}`);
      return url;
    }
    return await EmailSender.sendMail(this.mailer, message);
  }
}

class EmailSender {
  /** Transforms a message object into a nodemailer envelope
   *  @param {object} message An email message object
   *  @returns {object} NodeMailer email envelope object
   */
  static createEnvelope (message) {
    const envelope = utils.filterUndefinedAndEmpty(message);
    // Reassign the body field into the type specified by bodyType
    delete Object.assign(envelope, {
      [message.bodyType]: envelope['body']
    })['body'];
    // Remove the bodyType property
    delete envelope['bodyType'];
    return envelope;
  }
  
  static async sendMail (mailer, message) {
    try {
      const envelope = EmailSender.createEnvelope(message);
      
      // Send mail with defined transport object
      const info = await mailer.sendMail(envelope);
      
      log.debug('sendMail', info);
      return info;
    } catch (error) {
      log.error('sendMail', error.message);
      throw error;
    }
  }
}

class EmailServiceFactory {
  
  static initialize (conn) {
    if (!emailService) {
      emailService = new EmailService(conn);
    }
    return emailService;
  }
  
  static getService () {
    return emailService;
  }
  
  static async getEtherealInstance () {
    const conn = await EmailConnectionFactory.getEtherealConnection();
    return new EmailService(conn);
  }
}

module.exports = { EmailServiceFactory, EmailService };
