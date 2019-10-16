/**
 * @module QueueListener
 *
 * Listens to Bull queue events, calls QueueService to perform tasks.
 *
 * @see QueueService
 *
 * @see Bull
 *
 * @exports QueueListener
 */
const log = require('npmlog');

const QueueService = require('./queueSvc');

let queueService;

class QueueListener {
  
  /**
   * @function queueService
   * Get the default QueueService.
   * This is the QueueService that will be told to run tasks when events fire.
   */
  static get queueService () {
    if (!queueService) {
      queueService = new QueueService();
    }
    return queueService;
  }
  
  /** Cleanup message data upon job completion
   *  @param {object} job A Bull Queue Job object
   */
  static async onCompleted (job) {
    log.info('queue', `Job ${job.id} completed`);
    await QueueListener.queueService.updateStatus(job, 'completed');
    await QueueListener.queueService.updateContent(job);
  }
  
  /** Log the job error upon encountering an error
   *  @param {object} job A Bull Queue Job object
   */
  static async onError (job) {
    if (typeof job.id !== 'undefined') {
      await QueueListener.queueService.updateStatus(job, 'errored');
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
    await QueueListener.queueService.updateStatus(job, 'failed', job.failedReason);
    await QueueListener.queueService.updateContent(job);
  }
  
  /** Execute the message job task
   *  @param {object} job A Bull Queue Job object
   */
  static async onProcess (job) {
    log.info('queue', `Job ${job.id} is processing...`);
    
    try {
      if (job.data.messageId && job.data.client) {
        await QueueListener.queueService.updateStatus(job, 'processing');
        const result = await QueueListener.queueService.sendMessage(job);
        await QueueListener.queueService.updateStatus(job, 'delivered');
        await job.log(JSON.stringify(result));
        return result;
      } else {
        throw new Error('Message information missing or formatted incorrectly');
      }
    } catch (error) {
      await job.log(error.message);
      await QueueListener.queueService.updateStatus(job, 'move to failed');
      await job.moveToFailed({
        message: error.message
      }, true);
      await job.finished();
    }
  }
  
}

module.exports = QueueListener;
