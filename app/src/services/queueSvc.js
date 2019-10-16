const log = require('npmlog');

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
  
  async enqueue (client, message, opts = {}) {
    const job = this.queue.add({
      client: client,
      messageId: message.messageId
    }, Object.assign(opts, {
      jobId: message.messageId
    }));
    
    await this.dataService.updateStatus(client, message.messageId, 'enqueued');
    
    log.info('enqueue', `Job ${message.messageId} enqueued`);
    return job.id;
  }
  
  async updateContent (job) {
    if (job && job.data && job.data.messageId && job.data.client) {
      await this.dataService.deleteContent(job.data.client, job.data.messageId);
    }
    await job.update(null); // Scrub out client and message id
  }
  
  async updateStatus (job, status, description) {
    if (job && job.data && job.data.messageId && job.data.client) {
      await this.dataService.updateStatus(job.data.client, job.data.messageId, status, description);
    }
  }
  
  async sendMessage (job) {
    if (job && job.data && job.data.messageId && job.data.client) {
      try {
        const msg = await this.dataService.readMessage(job.data.client, job.data.messageId);
        return await this.emailService.send(msg.content.email);
      } catch (e) {
        log.error(`Error sending message from queue: client = ${job.data.client}, messageId = ${job.data.messageId}. ${e.message}`);
        log.error(JSON.stringify(e, null, 2));
      }
    }
    return null;
  }
}

module.exports = QueueService;
