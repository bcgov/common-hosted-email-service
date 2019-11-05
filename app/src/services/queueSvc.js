/**
 * @module QueueService
 *
 * Puts data on the queue for asynchronous processing.
 * Uses a DataService to read and write data (including getting the email).
 * Uses an EmailService to deliver the email.
 *
 * QueueListener will call the QueueService as events are fired in the queue
 *
 * @see DataService
 * @see EmailService
 * @see QueueConnection
 * @see QueueListener
 *
 * @see Bull
 *
 * @exports QueueService
 */
const log = require('npmlog');

const { queueState } = require('../components/state');
const utils = require('../components/utils');

const DataService = require('./dataSvc');
const EmailService = require('./emailSvc');
const QueueConnection = require('./queueConn');

class QueueService {
  /**
   * Creates a new QueueService with default connection, dataService and emailService.
   * @class
   */
  constructor() {
    this.connection = new QueueConnection();
    this.dataService = new DataService();
    this.emailService = new EmailService();
  }

  /**
   * @function connection
   * Gets the current QueueConnection
   */
  get connection() {
    return this._connection;
  }

  /**
   * @function connection
   * Sets the current QueueConnection
   * also sets the internal queue
   * @param {object} v - the QueueConnection
   */
  set connection(v) {
    this._connection = v;
    this._queue = this._connection.queue;
  }

  /**
   * @function dataService
   * Gets the current DataService
   */
  get dataService() {
    return this._dataService;
  }

  /**
   * @function dataService
   * Sets the current DataService
   * @param {object} v - the DataService
   */
  set dataService(v) {
    this._dataService = v;
  }

  /**
   * @function emailService
   * Gets the current DataService
   */
  get emailService() {
    return this._emailService;
  }

  /**
   * @function emailService
   * Sets the current DataService
   * @param {object} v - the EmailService
   */
  set emailService(v) {
    this._emailService = v;
  }

  /**
   * @function queue
   * Gets the current QueueConnection's queue
   */
  get queue() {
    return this._queue;
  }

  /**
   * @function enqueue
   * Adds a new job to the queue.
   * Job contains enough information for the service to read and update data required for the job.
   *
   * @param {string} client - the client that owns the message
   * @param {object} message - a Message object
   * @param {object} opts - Bull opts, including setting delay time
   */
  async enqueue(client, message, opts = {}) {
    await this.dataService.updateStatus(client, message.messageId, queueState.ENQUEUED);
    await this.queue.add({
      client: client,
      messageId: message.messageId
    }, Object.assign(opts, {
      jobId: message.messageId
    }))
      .then(() => log.info('enqueue', `Job ${message.messageId} enqueued`))
      .catch(e => log.error(e));
  }

  /**
   * @function findJob
   * Finds a job from the queue.
   *
   * @param {object} jobId - the messageId the message job is tracked as
   * @returns {object} the queued job if applicable
   */
  async findJob(jobId) {
    return await this.queue.getJob(jobId);
  }

  /**
   * @function updateContent
   * Update the persisted content (email message) for a Message.
   * When jobs are completed or failed/errored, we want to remove the email content.
   *
   * @param {object} job - the queue job
   */
  async updateContent(job) {
    if (job && job.data && job.data.messageId && job.data.client) {
      await this.dataService.deleteMessageEmail(job.data.client, job.data.messageId);
    }
  }

  /**
   * @function updateStatus
   * Update the persisted status for a Message
   *
   * @param {object} job - the queue job
   * @param {string} status - the queue related status, (potentiall) different a business status
   * @param {string} description - optional description for the status, generally an error message
   */
  async updateStatus(job, status, description) {
    if (job && job.data && job.data.messageId && job.data.client) {
      this.dataService.updateStatus(job.data.client, job.data.messageId, status, description);
    }
  }

  /**
   * @function sendMessage
   * Get the persisted email content and send it through the EmailService.
   *
   * @param {object} job - the queue job
   */
  async sendMessage(job) {
    if (job && job.data && job.data.messageId && job.data.client) {
      try {
        const msg = await this.dataService.readMessage(job.data.client, job.data.messageId);
        const smtpResult = await this.emailService.send(msg.email);
        const sendResult = { smtpMsgId: smtpResult.messageId, response: smtpResult.response };
        await this.dataService.updateMessageSendResult(job.data.client, job.data.messageId, sendResult);
      } catch (e) {
        log.error(`Error sending message from queue: client = ${job.data.client}, messageId = ${job.data.messageId}. ${e.message}`);
        log.error(utils.prettyStringify(e));
      }
    }
  }

  /**
   * @function removeJob
   * Removes the job from the queue.
   *
   * @param {string} client - the authorized party / client
   * @param {object} job - the queue job
   */
  async removeJob(client, job) {
    if (job && job.data && job.data.messageId && job.data.client) {
      await job.remove();
      this.dataService.updateStatus(client, job.data.messageId, queueState.REMOVED);
      this.updateContent(job);
      log.info('removeJob', `Message ${job.data.messageId} removed from queue`);
    }
  }
}

module.exports = QueueService;
