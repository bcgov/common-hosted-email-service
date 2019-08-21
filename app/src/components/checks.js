const log = require('npmlog');

const SMTPConnection = require('nodemailer/lib/smtp-connection');

const checks = {
  /** Checks the connectivity of the SMTP host */
  getSmtpStatus: async () => {
    const host = 'apps.smtp.gov.bc.ca';
    const result = {
      authenticated: false,
      authorized: false,
      endpoint: `https://${host}`,
      healthCheck: false,
      name: 'SMTP Endpoint'
    };

    try {
      const connection = new SMTPConnection({
        host: host,
        port: 25,
        tls: {
          rejectUnauthorized: false // Do not fail on invalid certs
        }
      });

      await connection.connect();
      result.authenticated = true;
      result.authorized = true;
      result.healthCheck = true;
      // connection.quit();
    } catch (error) {
      log.error('getSmtpStatus', error.message);
      // connection.close();
    }

    return result;
  },

  /** Returns a list of all endpoint connectivity states */
  getStatus: () => Promise.all([
    checks.getSmtpStatus()
  ])
};

module.exports = checks;
