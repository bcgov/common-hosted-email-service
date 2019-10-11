const log = require('npmlog');

const { EmailConnectionFactory } = require('../services/email/connection');

const checks = {
  /** Checks the connectivity of the SMTP host
   *  @param {string} host The SMTP host endpoint
   *  @returns A result object
   */
  getSmtpStatus: async () => {
    
    const emailConnection = EmailConnectionFactory.getSmtpConnection();
    
    const result = {
      authenticated: false,
      authorized: false,
      endpoint: `https://${emailConnection.host()}`,
      healthCheck: false,
      name: 'SMTP Endpoint'
    };
    
    try {
      const emailConnectionOk = await emailConnection.verify();
      
      result.authenticated = true;
      result.authorized = true;
      result.healthCheck = emailConnectionOk;
    } catch (error) {
      log.error('getSmtpStatus', error.message);
    }
    
    return result;
  },
  
  /** Returns a list of all endpoint connectivity states
   * @returns {object[]} An array of result objects
   */
  getStatus: () => Promise.all([
    checks.getSmtpStatus()
  ])
};

module.exports = checks;
