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
  constructor () {
    const configuration = {
      redis: {
        host: config.get('redis.host'),
        password: config.get('redis.password')
      }
    };
    this.queue = new Bull('ches', configuration);
  }
  
  /** @function queue
   *  Gets the underlying Bull queue
   */
  get queue () {
    return this._queue;
  }
  
  /** @function queue
   *  Sets the underlying Bull queue
   *  Also sets the globalQueue object
   *  @param {object} v - a new Bull instance
   */
  set queue (v) {
    this._queue = v;
    this._connected = false;
    globalQueue = this._queue;
  }
  
  /** @function connected
   *  True or false if connected.
   */
  get connected () {
    return this._connected;
  }
  
  /** @function close
   *  Will close the globally stored QueueConnection
   */
  static close () {
    if (globalQueue) {
      try {
        globalQueue.close();
        // eslint-disable-next-line no-empty
      } catch (e) {
      
      }
    }
  }
  
  /** @function checkConnection
   *  Checks the current QueueConnection and returns true if queue is connected.
   */
  async checkConnection () {
    this._connected = false;
    for (let i = 0; i < 5; i++) {
      if (this._queue.clients[0].status === 'ready') {
        log.info('Connected to Redis');
        this._connected = true;
        break;
      }
      await utils.wait(1000);
    }
    if (!this._connected) {
      log.error('Unable to connect to Redis...');
    }
    return this._connected;
  }
}

module.exports = QueueConnection;
