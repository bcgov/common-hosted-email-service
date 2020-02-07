const log = require('npmlog');

const DataConnection = require('../services/dataConn');
const EmailConnection = require('../services/emailConn');
const QueueConnection = require('../services/queueConn');

const healthCheck = {
  /**
   *  @function getDataHealth
   *  Checks the connectivity of the database
   *  @returns {object} A result object
   */
  getDataHealth: async () => {
    const result = {
      name: 'database',
      healthy: await new DataConnection().checkConnection()
    };
    if (result.healthy) {
      result.info = 'Database Service connected successfully.';
    } else {
      result.info = 'Database Service connection failed.';
    }
    return result;
  },

  /**
   *  @function getQueueHealth
   *  Checks the connectivity of the queue
   *  @returns {object} A result object
   */
  getQueueHealth: async () => {
    const result = {
      name: 'queue',
      healthy: await new QueueConnection().checkConnection()
    };
    if (result.healthy) {
      result.info = 'Queue Service connected successfully.';
    } else {
      result.info = 'Queue Service connection failed.';
    }
    return result;
  },

  /**
   *  @function getSmtpHealth
   *  Checks the connectivity of the SMTP host
   *  @returns {object} A result object
   */
  getSmtpHealth: async () => {
    const result = { name: 'smtp', healthy: false };
    try {
      result.healthy = await new EmailConnection().checkConnection();
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
  getAll: () => Promise.all([
    healthCheck.getDataHealth(),
    healthCheck.getQueueHealth(),
    healthCheck.getSmtpHealth()
  ])

};

module.exports = healthCheck;
