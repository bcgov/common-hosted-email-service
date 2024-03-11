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
const log = require('../components/log')(module.filename);
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
    log.info(`Job ${job.id} completed`, { function: 'onCompleted' });
    await QueueListener.queueService.updateStatus(job, queueState.COMPLETED);
    await QueueListener.queueService.updateContent(job);
  }

  /**
   * @function onError
   * Log the job error upon encountering an error
   * @param {object} error A Bull Queue Job object
   */
  static async onError(error) {
    if (typeof error.id !== 'undefined') {
      log.error(`Job ${error.id} errored`, { function: 'onError' });
      await QueueListener.queueService.updateStatus(error, queueState.ERRORED);
    } else {
      log.error(error.message, { function: 'onError' });
    }
  }

  /**
   * @function onFailed
   * Cleanup message data upon job failure
   * @param {object} job A Bull Queue Job object
   */
  static async onFailed(job) {
    log.error(`Job ${job.id} failed`, { function: 'onFailed' });
    await QueueListener.queueService.updateStatus(job, queueState.FAILED, job.failedReason).catch(() => {
      // This should only ever be reached if there exists database/redis state inconsistencies
      log.error(`Status update for job ${job.id} failed. Check for data integrity!`, { function: 'onFailed' });
    });
    // await QueueListener.queueService.updateContent(job);
  }

  /**
   * @function onProcess
   * Execute the message job task
   * @param {object} job A Bull Queue Job object
   */
  static async onProcess(job) {
    let attemptMsg = (job.attemptsMade) ? ` (Attempt ${job.attemptsMade + 1})...` : '...';
    log.info(`Job ${job.id} is processing${attemptMsg}`, { function: 'onProcess' });

    if (job.data.messageId && job.data.client) {
      await QueueListener.queueService.updateStatus(job, queueState.PROCESSING);
      await QueueListener.queueService.sendMessage(job);
      log.info(`Job ${job.id} delivered`, { function: 'onProcess' });
      await QueueListener.queueService.updateStatus(job, queueState.DELIVERED);
    } else {
      throw new Error('Message information missing or formatted incorrectly');
    }
  }

  /**
   * @function onDrained
   * Notify when queue has caught up with backlog
   */
  static onDrained() {
    log.info('Job backlog is clear', { function: 'onDrained' });
  }

  /**
   * @function onRemoved
   * Remove the message job task
   * @param {object} job A Bull Queue Job object
   */
  static async onRemoved(job) {
    log.info(`Job ${job.id} removed`, { function: 'onRemoved' });
    await QueueListener.queueService.updateStatus(job, queueState.REMOVED);
    await QueueListener.queueService.updateContent(job);
  }

}

module.exports = QueueListener;
