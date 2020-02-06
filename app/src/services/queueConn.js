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
const utils = require('../components/utils');

let globalQueue;

class QueueConnection {
  /**
   * Creates a new QueueConnection with default configuration.
   * @class
   */
  constructor() {
    const configuration = {
      redis: {
        host: config.get('redis.host'),
        password: config.get('redis.password')
      }
    };
    this.queue = new Bull('ches', configuration);
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
   *  Also sets the globalQueue object
   *  @param {object} v - a new Bull instance
   */
  set queue(v) {
    this._queue = v;
    this._connected = false;
    globalQueue = this._queue;
  }

  /** @function connected
   *  True or false if connected.
   */
  get connected() {
    return this._connected;
  }

  /**
   *  @function close
   *  Will close the globally stored QueueConnection
   */
  static close() {
    if (globalQueue) {
      try {
        globalQueue.close();
        log.info('QueueConnection', 'Disconnected');
      } catch (e) {
        log.error(e);
      }
    }
  }

  /**
   *  @function checkConnection
   *  Checks the current QueueConnection
   *  @param {integer} [timeout=1] Number of seconds to retry before failing out
   *  @returns boolean True if queue is connected
   */
  async checkConnection(timeout = 5) {
    // Redis does not establish connection immediately.
    // You need a small grace period checking for the status.
    for (let i = 0; i < timeout; i++) {
      this._connected = this.queue.clients[0].status === 'ready';
      if (this.connected) break;
      await utils.wait(1000);
    }
    if (!this.connected) {
      log.error('QueueConnection', 'Unable to connect to queue');
    }
    return this._connected;
  }
}

module.exports = QueueConnection;
