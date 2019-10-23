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
const utils = require('../components/utils');

const DataService = require('./dataSvc');
const EmailService = require('./emailSvc');
const QueueService = require('./queueSvc');
const Transformer = require('./transform');

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

  /** @function dataService
   *  Gets the current DataService
   */
  get dataService() {
    return this._dataService;
  }

  /** @function dataService
   *  Sets the current DataService
   *  @param {object} v - a DataService object.
   */
  set dataService(v) {
    this._dataService = v;
  }

  /** @function emailService
   *  Gets the current EmailService
   */
  get emailService() {
    return this._emailService;
  }

  /** @function emailService
   *  Sets the current EmailService
   *  @param {object} v - am EmailService object.
   */
  set emailService(v) {
    this._emailService = v;
  }

  /** @function queueService
   *  Gets the current QueueService
   */
  get queueService() {
    return this._queueService;
  }

  /** @function queueService
   *  Sets the current QueueService
   *  @param {object} v - a QueueService.
   */
  set queueService(v) {
    this._queueService = v;
  }

  async findStatuses(client, query, fields) {
    let fieldArray;
    if (fields) {
      fieldArray = fields.split(',')
        .map(field => {
          switch (field) {
            case 'createdTimestamp': return 'createdAt';
            case 'delayTS': return 'delayTimestamp';
            case 'updatedTimestamp': return 'updatedAt';
            default: return;
          }
        })
        .filter(field => field != null);
    }

    return await this.dataService.findMessagesByQuery(client, query.msgId, query.status, query.tag, query.txId, fieldArray);
  }

  async getStatus(client, messageId) {
    if (!messageId) {
      throw new Problem(400, { detail: 'Error getting status. Message Id cannot be null' });
    }

    try {
      // fetch the message and statuses... (throws error if not found)
      const msg = await this.dataService.readMessage(client, messageId);

      // transform message and statuses into API format...
      const status = Transformer.status(msg);
      return status;
    } catch (e) {
      if (e instanceof NotFoundError) {
        log.error(`Get Status for client = ${client} & messageId = ${messageId} error. Message not found`);
        throw new Problem(404, { detail: `Error getting status for message ${messageId} (Client ${client}). Message not found.` });
      } else {
        log.error(`Get Status for client = ${client} & messageId = ${messageId} error. ${e.message}`);
        log.error(JSON.stringify(e, null, 2));
        throw new Problem(500, { detail: `Error getting status for client = ${client} & messageId = ${messageId}. ${e.message}` });
      }
    }
  }

  /** @function sendEmail
   *  Creates and Queues the API message for delivery
   *  @param {string} client - the authorized party / client
   *  @param {object} message - the API email message
   *  @param {boolean} ethereal - if true, then use the Ethereal connection, send email immediately.
   *  @returns {object} TransactionResponse
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
        let trxn = await this.dataService.createTransaction(client, message);

        // queue up the messages...
        const delayTS = trxn.messages[0].delayTimestamp;
        const delay = delayTS ? utils.calculateDelayMS(delayTS) : undefined;
        await this.queueService.enqueue(client, trxn.messages[0], { delay: delay });

        // fetch the transaction/messages/statuses...
        trxn = await this.dataService.readTransaction(client, trxn.transactionId);

        //return to caller in API format
        return Transformer.transaction(trxn);
      }
    } catch (e) {
      log.error(`Send Email error. ${e.message}`);
      log.error(JSON.stringify(e, null, 2));
      throw new Problem(500, { detail: `Error sending email. ${e.message}` });
    }
  }

  /** @function sendEmailMerge
   *  Creates and Queues the API messages for delivery
   *  @param {string} client - the authorized party / client
   *  @param {object} template - the API email template
   *  @param {boolean} ethereal - if true, then use the Ethereal connection, send email immediately.
   *  @returns {object} TransactionResponse
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

        // fetch the updated transaction/messages/statuses...
        trxn = await this.dataService.readTransaction(client, trxn.transactionId);

        // return transaction in API format
        return Transformer.transaction(trxn);
      }
    } catch (e) {
      log.error(`Send Email Merge error. ${e.message}`);
      log.error(JSON.stringify(e, null, 2));
      throw new Problem(500, { detail: `Error sending email merge. ${e.message}` });
    }
  }
}

module.exports = ChesService;
