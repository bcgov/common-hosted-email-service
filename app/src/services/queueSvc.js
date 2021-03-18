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

const DataService = require('./dataSvc');
const EmailService = require('./emailSvc');
const QueueConnection = require('./queueConn');

class ClientMismatchError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, ClientMismatchError);
  }
}

class DataIntegrityError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, DataIntegrityError);
  }
}

class UncancellableError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UncancellableError);
  }
}

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
    try {
      const job = await this.queue.add({
        client: client,
        messageId: message.messageId
      }, Object.assign(opts, {
        jobId: message.messageId
      }));
      log.info('QueueService.enqueue', `Job ${job.id} enqueued`);
    } catch (e) {
      e.message = 'Queue Error: ' + e.message;
      throw e;
    }
    await this.dataService.updateStatus(client, message.messageId, queueState.ENQUEUED);
  }

  /**
   * @function updateContent
   * Update the persisted content (email message) for a Message.
   * When jobs are completed or failed/errored, we want to remove the email content.
   *
   * @param {object} job - the queue job
   */
  async updateContent(job) {
    try {
      if (job && job.data && job.data.messageId && job.data.client) {
        await this.dataService.deleteMessageEmail(job.data.client, job.data.messageId);
      }
    } catch (e) {
      log.error('QueueService.updateContent', `Failed to update content for message ${job.id}. ${e.message}`);
    }
  }

  /**
   * @function updateStatus
   * Update the persisted status for a Message
   *
   * @param {object} job - the queue job
   * @param {string} status - the queue related status
   * @param {string} description - optional description for the status, generally an error message
   */
  async updateStatus(job, status, description) {
    if (job && job.data && job.data.messageId && job.data.client) {
      await this.dataService.updateStatus(job.data.client, job.data.messageId, status, description);
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
        log.error('QueueService.sendMessage', `Error sending message from queue: client = ${job.data.client}, messageId = ${job.data.messageId}.`);
        throw (e);
      }
    }
  }

  /**
   * @function removeJob
   * Attempts to remove the job from the queue.
   *
   * @param {string} client - the authorized party / client
   * @param {object} jobId - the job id of the desired message
   * @throws ClientMismatchError if job client does not match `client`
   * @throws DataIntegrityError if job data is in an inconsistent state
   * @throws UncancellableError if job state must is not 'delayed'
   * @returns {boolean} True if successful, false if job was not found
   */
  async removeJob(client, jobId) {
    const job = await this.queue.getJob(jobId);

    if (job && job.data && job.data.client && job.data.messageId) {
      // Job found with proper structure
      if (job.data.messageId !== jobId) {
        throw new DataIntegrityError(`Message ${jobId} data is inconsistent or corrupted.`);
      } else if (job.data.client !== client) {
        throw new ClientMismatchError(`Message ${jobId} is not owned by client ${job.data.client}.`);
      } else if (await job.getState() !== 'delayed') {
        throw new UncancellableError(`Message ${jobId} is not cancellable.`);
      } else {
        // Immediately remove from queue
        await job.remove();
        log.info('QueueService.removeJob', `Message ${job.data.messageId} removed from queue`);
        return true;
      }
    } else {
      return false;
    }
  }
}

module.exports = { ClientMismatchError, DataIntegrityError, UncancellableError, QueueService };
