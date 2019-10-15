const Bull = require('bull');
const config = require('config');
const log = require('npmlog');
const utils = require('../components/utils');

let globalQueue;

class QueueConnection {
  
  constructor () {
    this.configuration = {
      redis: {
        host: config.get('redis.host'),
        password: config.get('redis.password')
      }
    };
  }
  
  get queue () {
    return this._queue;
  }
  
  get configuration () {
    return this._configuration;
  }
  
  set configuration (v) {
    this._configuration = v;
    this._queue = new Bull('ches', this._configuration);
    this._connected = false;
    globalQueue = this._queue;
  }
  
  get connected () {
    return this._connected;
  }
  
  static close () {
    if (globalQueue) {
      try {
        globalQueue.close();
        // eslint-disable-next-line no-empty
      } catch (e) {
      
      }
    }
  }
  
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
