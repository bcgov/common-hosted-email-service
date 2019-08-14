const log = require('npmlog');

const SMTPConnection = require('nodemailer/lib/smtp-connection');

const checks = {
  getSmtpStatus: async () => {
    const host = 'apps.smtp.gov.bc.cas';
    const result = {
      authenticated: false,
      authorized: false,
      endpoint: `https://${host}`,
      healthCheck: false,
      name: 'SMTP Endpoint'
    };
    const connection = new SMTPConnection({
      host: host,
      port: 25,
      tls: {
        rejectUnauthorized: false // Do not fail on invalid certs
      }
    });

    try {
      connection.connect(() => {
        result.authenticated = true;
        result.authorized = true;
        result.healthCheck = true;
      });
      connection.quit();
    } catch (error) {
      log.error('getSmtpStatus', error.message);
      connection.close();
    }

    return result;
  },

  getStatus: () => Promise.all([
    checks.getSmtpStatus()
  ])
};

module.exports = checks;
