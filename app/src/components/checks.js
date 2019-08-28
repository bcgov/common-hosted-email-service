const log = require('npmlog');
const nodemailer = require('nodemailer');

const checks = {
  /** Checks the connectivity of the SMTP host
   *  @param {string} host The SMTP host endpoint
   *  @returns A result object
  */
  getSmtpStatus: async host => {
    const result = {
      authenticated: false,
      authorized: false,
      endpoint: `https://${host}`,
      healthCheck: false,
      name: 'SMTP Endpoint'
    };

    try {
      const transporter = nodemailer.createTransport({
        host: host,
        port: 25,
        tls: {
          rejectUnauthorized: false // do not fail on invalid certs
        }
      });

      await transporter.verify();
      result.authenticated = true;
      result.authorized = true;
      result.healthCheck = true;
    } catch (error) {
      log.error('getSmtpStatus', error.message);
    }

    return result;
  },

  /** Returns a list of all endpoint connectivity states
   * @returns {object[]} An array of result objects
   */
  getStatus: () => Promise.all([
    checks.getSmtpStatus('apps.smtp.gov.bc.ca') // TODO: move this to constants file
  ])
};

module.exports = checks;
