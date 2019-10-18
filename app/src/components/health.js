const log = require('npmlog');

const EmailConnection = require('../services/emailConn');

const checks = {
  /** Checks the connectivity of the SMTP host
   *  @returns A result object
   */
  getSmtpStatus: async () => {

    const emailConnection = new EmailConnection();

    const result = {
      authenticated: false,
      authorized: false,
      endpoint: `https://${emailConnection.host}`,
      healthCheck: false,
      name: 'SMTP Endpoint'
    };

    try {
      const emailConnectionOk = await emailConnection.checkConnection();

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
