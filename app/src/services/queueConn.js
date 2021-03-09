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

/**
 * @function _createClient
 * Creates and returns an ioredis connection
 * @returns Object An ioredis object
 */
const _createClient = () => {
  let redis;

  const redisOpts = {
    password: config.get('redis.password'),
    reconnectOnError: (err) => err.message.toUpperCase().includes('READONLY')
  };
  if (config.get('redis.clusterMode') === 'yes') {
    redis = new Redis.Cluster([{
      host: config.get('redis.host')
    }], {
      redisOptions: redisOpts
    });
  } else {
    redisOpts.host = config.get('redis.host');
    redis = new Redis(redisOpts);
  }

  redis.on('ready', () => {
    log.debug('QueueConnection', 'Redis Ready');
  });
  redis.on('reconnecting', () => {
    log.debug('QueueConnection', 'Redis Reconnecting...');
  });
  redis.on('connect', () => {
    log.debug('QueueConnection', 'Redis Connected');
  });

  return redis;
};

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
      createClient: _createClient
    };

    if (!QueueConnection.instance) {
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
    this._connected = false;
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
  async checkConnection() {
    let isReady = await Promise.all([
      this.checkRedis(this.queue.clientInitialized, this.queue.client),
      this.checkRedis(this.queue.subscriberInitialized, this.queue.sclient),
      this.checkRedis(this.queue.bclientInitialized, this.queue.bclient)
    ]);

    if (!isReady) {
      log.error('QueueConnection.checkConnection', 'Redis connections not ready');
    }

    this._connected = isReady;
    return this.connected;
  }

  async checkRedis(initialized, client, timeout = 5) {
    // Bull and Redis needs a small grace period to initialize.
    for (let i = 0; i < timeout; i++) {
      if (initialized) break;
      await utils.wait(1000);
    }

    return client && client.status === 'ready';
  }
}

module.exports = QueueConnection;
