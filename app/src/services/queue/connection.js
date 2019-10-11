const Bull = require('bull');
const config = require('config');
const log = require('npmlog');
const utils = require('../../components/utils');

let queueConnection;

class QueueConnection {
  constructor (name = 'ches', configuration) {
    if (!configuration) {
      configuration = {
        redis: {
          host: config.get('redis.host'),
          password: config.get('redis.password')
        }
      };
      this.chesQueue = new Bull(name, configuration);
      this.connected = false;
    }
  }
  
  queue () {
    return this.chesQueue;
  }
  
  async initialize () {
    for (let i = 0; i < 5; i++) {
      if (this.chesQueue.clients[0].status === 'ready') {
        log.info('Connected to Redis');
        this.connected = true;
        break;
      }
      await utils.wait(1000);
    }
    if (!this.connected) {
      log.error('Unable to connect to Redis...');
    }
    return this.connected;
  }
}

class QueueConnectionFactory {
  
  static getConnection (name, configuration) {
    if (!queueConnection) {
      queueConnection = new QueueConnection(name, configuration);
    }
    return queueConnection;
  }
  
  static close () {
    if (queueConnection) {
      queueConnection.queue().close();
    }
  }
}

module.exports = { QueueConnectionFactory, QueueConnection };
