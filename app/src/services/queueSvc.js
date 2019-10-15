const log = require('npmlog');
const uuidv4 = require('uuid/v4');

const DataService = require('./dataSvc');
const EmailService = require('./emailSvc');
const QueueConnection = require('./queueConn');

class QueueService {
  constructor () {
    this.connection = new QueueConnection();
    this.dataService = new DataService();
    this.emailService = new EmailService();
  }
  
  get connection () {
    return this._connection;
  }
  
  set connection (v) {
    this._connection = v;
    this._queue = this._connection.queue;
  }
  
  get dataService () {
    return this._dataService;
  }
  
  set dataService (v) {
    this._dataService = v;
  }
  
  get emailService () {
    return this._emailService;
  }
  
  set emailService (v) {
    this._emailService = v;
  }
  
  get queue () {
    return this._queue;
  }
  
  async enqueue (message, opts = {}) {
    const id = uuidv4();
    const job = this.queue.add({
      message: message.content.email,
      messageId: message.messageId
    }, Object.assign(opts, {
      jobId: id
    }));
    
    await this.dataService.updateStatus(message.messageId, id, 'enqueued');
    
    log.info('enqueue', `Job ${id} enqueued`);
    return job.id;
  }
  
  async updateContent (job) {
    if (job && job.data && job.data.messageId) {
      await this.dataService.deleteContent(job.data.messageId);
    }
    await job.update(null); // Scrub out message information on finish
  }
  
  async updateStatus (job, status, description) {
    if (job && job.data && job.data.messageId) {
      await this.dataService.updateStatus(job.data.messageId, job.id, status, description);
    }
  }
  
  async sendMessage (message) {
    if (message) {
      return await this.emailService.send(message);
    }
    return null;
  }
}

module.exports = QueueService;
