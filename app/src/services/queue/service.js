const log = require('npmlog');
const uuidv4 = require('uuid/v4');

let queueService;

class QueueService {
  constructor (connection, dataService, emailService) {
    this.connection = connection;
    this.queue = connection.queue();
    this.dataService = dataService;
    this.emailService = emailService;
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
  
  async sendMail (message) {
    if (message) {
      return await this.emailService.sendMail(message);
    }
    return null;
  }
}

class QueueListener {
  
  /** Cleanup message data upon job completion
   *  @param {object} job A Bull Queue Job object
   */
  static async onCompleted (job) {
    log.info('queue', `Job ${job.id} completed`);
    await QueueServiceFactory.getService().updateStatus(job, 'completed');
    await QueueServiceFactory.getService().updateContent(job);
  }
  
  /** Log the job error upon encountering an error
   *  @param {object} job A Bull Queue Job object
   */
  static async onError (job) {
    if (typeof job.id !== 'undefined') {
      await QueueServiceFactory.getService().updateStatus(job, 'errored');
      log.error('queue', `Job ${job.id} errored`);
    } else {
      log.error('queue', 'A Job failed');
    }
  }
  
  /** Cleanup message data upon job failure
   *  @param {object} job A Bull Queue Job object
   */
  static async onFailed (job) {
    log.error('queue', `Job ${job.id} failed`);
    await QueueServiceFactory.getService().updateStatus(job, 'failed', job.failedReason);
    await QueueServiceFactory.getService().updateContent(job);
  }
  
  /** Execute the message job task
   *  @param {object} job A Bull Queue Job object
   */
  static async onProcess (job) {
    log.info('queue', `Job ${job.id} is processing...`);
    
    try {
      if (job.data.message) {
        await QueueServiceFactory.getService().updateStatus(job, 'processing');
        const result = await QueueServiceFactory.getService().sendMail(job.data.message);
        await QueueServiceFactory.getService().updateStatus(job, 'delivered');
        await job.log(JSON.stringify(result));
        return result;
      } else {
        throw new Error('Message missing or formatted incorrectly');
      }
    } catch (error) {
      await job.log(error.message);
      await QueueServiceFactory.getService().updateStatus(job, 'move to failed');
      await job.moveToFailed({
        message: error.message
      }, true);
      await job.finished();
    }
  }
  
}

class QueueServiceFactory {
  
  static initialize (queue, dataService, emailService) {
    if (!queueService) {
      queueService = new QueueService(queue, dataService, emailService);
    }
    return queueService;
  }
  
  static getService () {
    return queueService;
  }
}

module.exports = { QueueServiceFactory, QueueService, QueueListener };
