const log = require('npmlog');

const EmailConnection = require('../services/emailConn');

const healthCheck = {
  /** Checks the connectivity of the SMTP host
   *  @returns A result object
   */
  getSmtpHealth: async () => {
    const result = { name: 'smtp', healthy: false, info: null };
    try {
      const emailConnection = new EmailConnection();
      result.healthy = await emailConnection.checkConnection();
      result.info = 'SMTP Service connected successfully.';
    } catch (error) {
      log.error('getSmtpHealth', error.message);
      result.info = error.message;
    }
    return result;
  },

  /** Returns a list of all endpoint connectivity states
   * @returns {object[]} An array of result objects
   */
  getAll: () => Promise.all([healthCheck.getSmtpHealth()])

};

module.exports = healthCheck;
