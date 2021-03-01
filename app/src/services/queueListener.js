/**
 * @module QueueListener
 *
 * Listens to Bull queue events, calls QueueService to perform tasks.
 *
 * @see Bull
 * @see QueueService
 *
 * @exports QueueListener
 */
const log = require('npmlog');

const { queueState } = require('../components/state');

const { QueueService } = require('./queueSvc');

let queueService;

class QueueListener {

  /**
   * @function queueService
   * Get the default QueueService.
   * This is the QueueService that will be told to run tasks when events fire.
   */
  static get queueService() {
    if (!queueService) {
      queueService = new QueueService();
    }
    return queueService;
  }

  /**
   * @function onCompleted
   * Cleanup message data upon job completion
   * @param {object} job A Bull Queue Job object
   */
  static async onCompleted(job) {
    log.info('onCompleted', `Job ${job.id} completed`);
    await QueueListener.queueService.updateStatus(job, queueState.COMPLETED);
    QueueListener.queueService.updateContent(job);
  }

  /**
   * @function onError
   * Log the job error upon encountering an error
   * @param {object} job A Bull Queue Job object
   */
  static async onError(job) {
    if (typeof job.id !== 'undefined') {
      log.error('onError', `Job ${job.id} errored`);
      QueueListener.queueService.updateStatus(job, queueState.ERRORED);
    } else if (QueueListener.queueService.queue.clients[0].status === 'ready') {
      // An error occured, but wasn't caused by Redis going offline
      log.error('onError', 'A Job failed', job.message);
    }
  }

  /**
   * @function onFailed
   * Cleanup message data upon job failure
   * @param {object} job A Bull Queue Job object
   */
  static async onFailed(job) {
    log.error('onFailed', `Job ${job.id} failed`);
    await QueueListener.queueService.updateStatus(job, queueState.FAILED, job.failedReason);
    QueueListener.queueService.updateContent(job);
  }

  /**
   * @function onProcess
   * Execute the message job task
   * @param {object} job A Bull Queue Job object
   */
  static async onProcess(job) {
    log.info('onProcess', `Job ${job.id} is processing...`);

    try {
      if (job.data.messageId && job.data.client) {
        await QueueListener.queueService.updateStatus(job, queueState.PROCESSING);
        await QueueListener.queueService.sendMessage(job);
        log.info('onProcess', `Job ${job.id} delivered`);
        QueueListener.queueService.updateStatus(job, queueState.DELIVERED);
      } else {
        throw new Error('Message information missing or formatted incorrectly');
      }
    } catch (error) {
      await job.moveToFailed({
        message: error.message
      }, true);
      await job.finished();
    }
  }

}

module.exports = QueueListener;
