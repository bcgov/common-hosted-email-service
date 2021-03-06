/**
 * @module QueueConnection
 *
 * Create and check the connection for a Bull queue.
 *
 * @see QueueService
 *
 * @see Bull
 *
 * @exports QueueConnection
 */
const Bull = require('bull');
const config = require('config');
const log = require('npmlog');
const Redis = require('ioredis');
const utils = require('../components/utils');

class QueueConnection {
  /**
   * Creates a new QueueConnection with default configuration.
   * @class
   */
  constructor() {
    /**
     * Configuration object for Bull queue
     */
    const bullConfig = {
      // Prefix must be explicitly defined with brackets to support Redis Clustering
      // https://github.com/OptimalBits/bull/blob/master/PATTERNS.md#redis-cluster
      prefix: '{bull}',
      // The Cluster instance must be created inside createClient to behave correctly
      // https://github.com/OptimalBits/bull/issues/1401#issuecomment-519443898
      createClient: () => {
        let redis;
        if (config.get('redis.clusterMode') === 'yes') {
          redis = new Redis.Cluster([{
            host: config.get('redis.host')
          }], {
            redisOptions: {
              password: config.get('redis.password')
            }
          });
        } else {
          redis = new Redis({
            host: config.get('redis.host'),
            password: config.get('redis.password')
          });
        }

        redis.on('end', (error) => {
          log.error('QueueConnection', `Redis Ended: ${error}`);
          this._connected = false;
        });
        redis.on('ready', () => {
          log.debug('QueueConnection', 'Redis Ready');
        });
        redis.on('connect', () => {
          log.debug('QueueConnection', 'Redis Connected');
          this._connected = true;
        });

        return redis;
      }
    };

    if (!QueueConnection.instance) {
      this._connected = false;
      this.queue = new Bull('ches', bullConfig);
      QueueConnection.instance = this;
    }

    return QueueConnection.instance;
  }

  /**
   *  @function queue
   *  Gets the underlying Bull queue
   */
  get queue() {
    return this._queue;
  }

  /**
   *  @function queue
   *  Sets the underlying Bull queue
   *  @param {object} v - a new Bull instance
   */
  set queue(v) {
    this._queue = v;
  }

  /**
   *  @function connected
   *  True or false if connected.
   */
  get connected() {
    return this._connected;
  }

  /**
   *  @function close
   *  Will close the QueueConnection
   */
  static close() {
    if (this.queue) {
      try {
        this.queue.close();
        this._connected = false;
        log.info('QueueConnection.close', 'Disconnected');
      } catch (e) {
        log.error(e);
      }
    }
  }

  /**
   *  @function checkConnection
   *  Checks the current QueueConnection
   *  @param {integer} [timeout=5] Number of seconds to retry before failing out
   *  @returns boolean True if queue is connected
   */
  async checkConnection(timeout = 5) {
    const status = [
      this.queue.clientInitialized,
      this.queue.subscriberInitialized,
      this.queue.bclientInitialized
    ];

    // Redis does not establish connection immediately.
    // You need a small grace period checking for the status.
    for (let i = 0; i < timeout; i++) {
      if (this.connected && status.every(x => x)) break;
      await utils.wait(1000);
    }
    if (!this.connected) {
      log.error('QueueConnection.checkConnection', 'Unable to connect to queue', status);
    }

    return this._connected;
  }
}

module.exports = QueueConnection;
