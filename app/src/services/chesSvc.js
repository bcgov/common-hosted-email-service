/**
 * @module ChesService
 *
 * Create a business service for CHES.
 * Provide a wrapper around business functions that use multiple services.
 *
 * @see DataService
 * @see EmailService
 * @see QueueService
 * @see Transformer
 *
 * @see mergeComponent
 *
 * @exports ChesService
 */
const log = require('npmlog');
const { NotFoundError } = require('objection');
const Problem = require('api-problem');

const mergeComponent = require('../components/merge');
const transformer = require('../components/transformer');
const utils = require('../components/utils');

const DataService = require('./dataSvc');
const EmailService = require('./emailSvc');
const {
  ClientMismatchError,
  DataIntegrityError,
  UncancellableError,
  QueueService
} = require('./queueSvc');

class ChesService {

  /**
   * Creates a new ChesService with default Data, Email, Queue Services (all with default connections).
   * @class
   */
  constructor() {
    this.dataService = new DataService();
    this.emailService = new EmailService();
    this.queueService = new QueueService();
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
   * @param {object} v - a DataService object.
   */
  set dataService(v) {
    this._dataService = v;
  }

  /**
   * @function emailService
   * Gets the current EmailService
   */
  get emailService() {
    return this._emailService;
  }

  /**
   * @function emailService
   * Sets the current EmailService
   * @param {object} v - am EmailService object.
   */
  set emailService(v) {
    this._emailService = v;
  }

  /**
   * @function queueService
   * Gets the current QueueService
   */
  get queueService() {
    return this._queueService;
  }

  /**
   * @function queueService
   * Sets the current QueueService
   * @param {object} v - a QueueService.
   */
  set queueService(v) {
    this._queueService = v;
  }

  /**
   * @function cancelMessage
   * @description Cancels message `messageId` if it is still waiting to send
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the desired message
   * @throws Problem if message is not found or conflicts with internal state
   */
  async cancelMessage(client, messageId) {
    if (!client || !messageId) {
      throw new Problem(400, { detail: 'Error cancelling message. Client and messageId cannot be null' });
    }

    try {
      // Try removing directly from queue first
      const success = await this.queueService.removeJob(client, messageId);
      if (!success) {
        // Check why a job was not found
        const exists = await this.dataService.messageExists(client, messageId);
        throw (!exists) ? new NotFoundError() :
          new UncancellableError(`Message ${messageId} is not cancellable.`);
      }
    } catch (e) {
      if (e instanceof ClientMismatchError) {
        log.info('ChesService.cancelMessage', e.message);
        throw new Problem(403, { detail: e.message });
      } else if (e instanceof DataIntegrityError) {
        log.error('ChesService.cancelMessage', e.message);
        throw new Problem(500, { detail: e.message });
      } else if (e instanceof NotFoundError) {
        log.info('ChesService.cancelMessage', `Message ${messageId} from client ${client} not found.`);
        throw new Problem(404, { detail: `Message ${messageId} not found.` });
      } else if (e instanceof UncancellableError) {
        log.info('ChesService.cancelMessage', e.message);
        throw new Problem(409, { detail: e.message });
      } else {
        throw e;
      }
    }
  }

  /**
   * @function findCancelMessages
   * @description Finds and attempts to cancel the set of messages matching the search criteria
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the desired message
   * @param {string} status - the desired status of the messages
   * @param {string} tag - the desired tag of the messages
   * @param {string} transactionId - the id of the desired transaction
   * @throws Problem if an unexpected error occurs
   */
  async findCancelMessages(client, messageId, status, tag, transactionId) {
    if (!client) {
      throw new Problem(400, { detail: 'Error finding and cancelling messages. Client cannot be null' });
    }

    try {
      const messages = await this.dataService.findMessagesByQuery(client, messageId, status, tag, transactionId);

      const integrityList = [];
      await Promise.all(messages.map(msg => {
        try {
          // Try removing directly from queue, then update db afterwards
          this.queueService.removeJob(client, msg.messageId);
        } catch (e) {
          if (e instanceof ClientMismatchError || e instanceof NotFoundError ||
              e instanceof UncancellableError) {
            log.info('ChesService.findCancelMessages', e.message);
          } else if (e instanceof DataIntegrityError) {
            log.error('ChesService.findCancelMessages', e.message);
            integrityList.push(msg.messageId);
          } else {
            throw e; // We want to throw and not return an error object in this case
          }
          return e;
        }
      }).filter(e => !!e)); // Drop undefined elements from array

      if (integrityList && integrityList.length) {
        log.error('ChesService.findCancelMessages', `Message(s) ${integrityList} inconsistent or corrupted.`);
        throw new Problem(500, {
          detail: 'Some message(s) are inconsistent or corrupted.',
          messages: integrityList
        });
      }
    } catch (e) {
      if (e instanceof NotFoundError) {
        log.info('ChesService.findCancelMessages', 'No messages found');
      } else if (e instanceof Problem) {
        throw e;
      } else {
        log.error('ChesService.findCancelMessages', e.message);
        throw new Problem(500, { detail: `Unexpected Error: ${e.message}` });
      }
    }
  }

  /**
   * @function findStatuses
   * @description Finds the set of message statuses that matches the search criteria
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the desired message
   * @param {string} status - the desired status of the messages
   * @param {string} tag - the desired tag of the messages
   * @param {string} transactionId - the id of the desired transaction
   * @throws Problem if an unexpected error occurs
   * @returns {object[]} Array of Status objects with a subset of properties
   */
  async findStatuses(client, messageId, status, tag, transactionId) {
    try {
      const result = await this.dataService.findMessagesByQuery(client, messageId, status, tag, transactionId);
      return result.map(msg => transformer.toStatusResponse(msg));
    } catch (e) {
      if (e instanceof NotFoundError) {
        log.verbose('ChesService.findStatuses', 'No messages found');
        return [];
      } else {
        log.error('ChesService.findStatuses', e.message);
        throw new Problem(500, { detail: `Unexpected Error: ${e.message}` });
      }
    }
  }

  /**
   * @function getStatus
   * @description Finds the message status of `messageId`
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the desired message
   * @throws Problem if an unexpected error occurs or if message is not found
   * @returns {object[]} The Status object for `messageId` if it exists
   */
  async getStatus(client, messageId) {
    if (!messageId) {
      throw new Problem(400, { detail: 'Error getting status. Message Id cannot be null' });
    }

    try {
      // fetch the message and statuses... (throws error if not found)
      const msg = await this.dataService.readMessage(client, messageId);

      // transform message and statuses into API format...
      const status = transformer.toStatusResponse(msg);
      return status;
    } catch (e) {
      if (e instanceof NotFoundError) {
        log.error('ChesService.getStatus', `Message ${messageId} from client ${client} not found.`);
        throw new Problem(404, { detail: `Message ${messageId} not found.` });
      } else {
        log.error('ChesService.getStatus', `Unable to retrieve status of message ${messageId} from client ${client}. ${e.message}`);
        log.error(utils.prettyStringify(e));
        throw new Problem(500, { detail: `Unable retrieve status of message ${messageId}. ${e.message}` });
      }
    }
  }

  /**
   * @function sendEmail
   * @description Creates and Queues the API message for delivery
   *
   * @param {string} client - the authorized party / client
   * @param {object} message - the API email message
   * @param {boolean} ethereal - if true, then use the Ethereal connection, send email immediately.
   * @returns {object} TransactionResponse
   */
  async sendEmail(client, message, ethereal = false) {
    if (!message) {
      throw new Problem(400, { detail: 'Error sending email. Email message cannot be null' });
    }
    if (!ethereal && !client) {
      throw new Problem(400, { detail: 'Error sending email. Authorized Party/Client cannot be null' });
    }

    try {
      if (ethereal) {
        const result = await this.emailService.send(message, true);
        return result;
      } else {
        // create the transaction...
        const trxn = await this.dataService.createTransaction(client, message);

        // queue up the messages...
        const delayTS = trxn.messages[0].delayTimestamp;
        const delay = delayTS ? utils.calculateDelayMS(delayTS) : undefined;
        await this.queueService.enqueue(client, trxn.messages[0], { delay: delay });

        //return to caller in API format
        return transformer.toTransactionResponse(trxn);
      }
    } catch (e) {
      log.error('ChesService.sendEmail', e.message);
      log.error(utils.prettyStringify(e));
      throw new Problem(500, { detail: `Error sending email. ${e.message}` });
    }
  }

  /**
   * @function sendEmailMerge
   * @description Creates and Queues the API messages for delivery
   *
   * @param {string} client - the authorized party / client
   * @param {object} template - the API email template
   * @param {boolean} ethereal - if true, then use the Ethereal connection, send email immediately.
   * @returns {object} TransactionResponse
   */
  async sendEmailMerge(client, template, ethereal = false) {
    if (!template) {
      throw new Problem(400, { detail: 'Error sending email merge. Email templates/contexts cannot be null' });
    }
    if (!ethereal && !client) {
      throw new Problem(400, { detail: 'Error sending email merge. Authorized Party/Client cannot be null' });
    }

    try {
      if (ethereal) {
        const contexts = mergeComponent.mergeTemplate(template);

        // Send all mail messages with defined transport object
        const results = await Promise.all(contexts.map(context => {
          // Remove delay as we do not use the queue for Ethereal messages
          delete context.delayTS;
          return this.emailService.send(context, true);
        }));

        return results;
      } else {
        // build out the individual messages from the payload...
        const contexts = mergeComponent.mergeTemplate(template);

        // create the transaction and messages...
        let trxn = await this.dataService.createTransaction(client, contexts);

        // Send all mail messages with defined transport object
        await Promise.all(trxn.messages.map(msg => {
          const delayTS = msg.delayTimestamp;
          const delay = delayTS ? utils.calculateDelayMS(delayTS) : undefined;
          this.queueService.enqueue(client, msg, { delay: delay });
        }));

        // return transaction in API format
        return transformer.toTransactionResponse(trxn);
      }
    } catch (e) {
      log.error('ChesService.sendEmailMerge', `Send Email Merge error. ${e.message}`);
      log.error(utils.prettyStringify(e));
      throw new Problem(500, { detail: `Error sending email merge. ${e.message}` });
    }
  }
}

module.exports = ChesService;
