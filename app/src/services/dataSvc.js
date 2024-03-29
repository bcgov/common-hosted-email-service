/**
 * @module DataService
 *
 * Service to persist data.
 *
 * @see DataConnection
 * @see knex
 * @see Objection
 *
 * @exports DataService
 */
const uuid = require('uuid');

const log = require('../components/log')(module.filename);
const { queueToStatus, statusState } = require('../components/state');
const utils = require('../components/utils');

const DataConnection = require('./dataConn');
const { Message, Queue, Status, Trxn } = require('./models/');

/**
 * @function createMessage
 * inserts all message related data into the db for a Trxn (transaction)
 * inserts an initial status and queue record.
 *
 * @param {string} transactionId - transaction parent record
 * @param {object} msg - API email message object
 * @param {object} trx - an Objection/Knex transaction for commit/rollback
 * @returns Message
 */
const createMessage = async (transactionId, msg, trx) => {
  const messageObj = await Message.query(trx).insert({
    messageId: uuid.v4(),
    transactionId: transactionId,
    tag: msg.tag,
    email: msg,
    delayTimestamp: msg.delayTS
  });

  // Insert initial status and queue accepted records
  await Status.query(trx).insert({
    messageId: messageObj.messageId
  });
  await Queue.query(trx).insert({
    messageId: messageObj.messageId
  });

  return messageObj;
};

/**
 * @function getClientTrxnQuery
 * @description Gets a list of all transactions created by `client`
 *
 * @param {string} client - the client
 * @returns An array of transactionIds
 */
const getClientTrxnQuery = client => {
  return Trxn.query()
    .select('transactionId')
    .where('client', client);
};

class DataService {

  /**
   * Creates a new DataService with default connection.
   * @class
   */
  constructor() {
    this.connection = new DataConnection();
  }

  /**
   * @function connection
   * Gets the current DataConnection
   */
  get connection() {
    return this._connection;
  }

  /**
   * @function connection
   * Sets the current DataConnection
   * @param {object} v - an DataConnection
   */
  set connection(v) {
    this._connection = v;
  }

  /**
   * @function createTransaction
   * Creates a Trxn (transaction) record with associated messages
   *
   * @param {string} client - the authorized party / client
   * @param {object} msg - the API email message or template.
   * @returns {object} Trxn object, fully populated with child messages and status
   */
  async createTransaction(client, msg) {
    if (!msg) {
      throw Error('Transaction cannot be created with email message(s)');
    }
    let trx;
    try {
      trx = await Trxn.startTransaction();
      const transactionId = uuid.v4();

      await Trxn.query(trx).insert({
        transactionId: transactionId,
        client: client
      });

      if (Array.isArray(msg)) {
        await Promise.all(msg.map(m => {
          return createMessage(transactionId, m, trx);
        }));
      } else {
        await createMessage(transactionId, msg, trx);
      }

      await trx.commit();
      return this.readTransaction(client, transactionId);
    } catch (err) {
      log.error(`Error creating transaction record: ${err.message}. Rolling back...`, { error: err, function: 'createTransaction' });
      if (trx) await trx.rollback();
      throw err;
    }
  }

  /**
   * @function deleteMessageEmail
   * Deletes the email data from a message.
   * We don't want to retain any private-ish data longer than required to perform our task.
   *
   * @param {string} client- the authorized party / client
   * @param {string} messageId - the id of the message we want to purge email
   * @throws NotFoundError if message for client not found
   * @returns {object} Message object, fully populated.
   */
  async deleteMessageEmail(client, messageId) {
    let trx;
    try {
      trx = await Message.startTransaction();

      // first query for message, throw not found if client/message not exist...
      await this.readMessage(client, messageId, trx);

      const cItems = await Message.query(trx)
        .patch({ email: null })
        .where('messageId', messageId);
      log.info(`Updated ${cItems} message email records...`, { function: 'deleteMessageEmail' });

      await trx.commit();
      return this.readMessage(client, messageId);
    } catch (err) {
      log.error('DataService.deleteMessageEmail', `Error updating message (email) record: ${err.message}. Rolling back...`, { error: err, function: 'deleteMessageEmail' });
      if (trx) await trx.rollback();
      throw err;
    }
  }

  /**
   * @function findMessagesByQuery
   * @description Finds the set of messages that matches the search criteria
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the desired message
   * @param {string} status - the desired status of the messages
   * @param {string} tag - the desired tag of the messages
   * @param {string} transactionId - the id of the desired transaction
   * @throws NotFoundError if no messages were found
   * @returns {object[]} Array of Message objects
   */
  async findMessagesByQuery(client, messageId, status, tag, transactionId) {
    const parameters = utils.dropUndefinedObject({
      messageId: messageId,
      status: status,
      tag: tag,
      transactionId: transactionId
    });

    return Message.query()
      .whereIn('transactionId', getClientTrxnQuery(client))
      .andWhere(parameters)
      .throwIfNotFound();
  }

  /**
   * @function messageExists
   * Determines if a Message exists
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the message we want
   * @returns {boolean} True if `messageId` for `client` exists
   */
  async messageExists(client, messageId) {
    const msg = await Message.query()
      .findById(messageId)
      .whereIn('transactionId', getClientTrxnQuery(client));

    return !!msg;
  }

  /**
   * @function readMessage
   * Read a Message from the db
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the message we want
   * @param {object} [trx] - optional transaction wrapper
   * @throws NotFoundError if message for client not found
   * @returns {object} Message object, fully populated.
   */
  async readMessage(client, messageId, trx = undefined) {
    return Message.query(trx)
      .findById(messageId)
      .whereIn('transactionId', getClientTrxnQuery(client))
      .withGraphJoined('statusHistory')
      .modifyGraph('statusHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      })
      .throwIfNotFound();
  }

  /**
   * @function readTransaction
   * Read a Transaction (Trxn) from the db
   *
   * @param {string} client - the authorized party / client
   * @param {string} transactionId - the id of the transaction we want
   * @throws NotFoundError if transaction for client not found
   * @returns {object} Trxn object
   */
  async readTransaction(client, transactionId) {
    return Trxn.query()
      .findById(transactionId)
      .where('client', client)
      .withGraphJoined('messages.statusHistory')
      .orderBy('messages:statusHistory.createdAt', 'desc')
      .throwIfNotFound();
  }

  /**
   * @function updateMessageSendResult
   * Updates the message's send result field.
   * The send result is populated once the email has been sent.
   *
   * @param {string} client- the authorized party / client
   * @param {string} messageId - the id of the message
   * @param {object} sendResult - the pared down SMTP result
   * @throws NotFoundError if message for client not found
   * @returns {object} Message object, fully populated.
   */
  async updateMessageSendResult(client, messageId, sendResult) {
    let trx;
    try {
      trx = await Message.startTransaction();

      // first query for message, throw not found if client/message not exist...
      await this.readMessage(client, messageId, trx);

      const cItems = await Message.query(trx)
        .patch({ sendResult: sendResult })
        .where('messageId', messageId);
      log.info(`Updated ${cItems} message (result) records...`, { function: 'updateMessageSendResult' });

      await trx.commit();
      return this.readMessage(client, messageId);
    } catch (err) {
      log.error(`Error updating message send result record: ${err.message}. Rolling back...`, { error: err, function: 'updateMessageSendResult' });
      if (trx) await trx.rollback();
      throw err;
    }
  }

  /**
   * @function updateStatus
   * Updates the message's current status.
   * Adds a new queue processing status (Queue) record.
   * Determines the business status and if required, add a new business status (Status) record.
   *
   * @param {string} client - the authorized party / client
   * @param {string} messageId - the id of the message we want to purge email content
   * @param {string} status - the queue processing status
   * @param {string} description - optional description, mostly used for error/failure statuses
   * @throws NotFoundError if message for client not found
   * @returns {object} Message object
   */
  async updateStatus(client, messageId, status, description) {
    let trx;
    try {
      trx = await Message.startTransaction();

      // first query for message, throw not found if client/message not exist...
      const msg = await this.readMessage(client, messageId, trx);

      const businessStatus = queueToStatus(status);
      // Update business status if it has a description or is different than current state
      if (description || msg.status !== businessStatus) {
        // Only update message status if in appropriate states
        if (!msg.sendResult || msg.sendResult && businessStatus === statusState.COMPLETED) {
          await msg.$query(trx).patch({ status: businessStatus });
        }
        // Add a new status record
        await Status.query(trx).insert({
          messageId: messageId,
          status: businessStatus,
          description: description
        });
      }

      // Always add a new queue record
      await Queue.query(trx).insert({
        messageId: messageId,
        status: status,
        description: description
      });

      await trx.commit();
      return this.readMessage(client, messageId);
    } catch (err) {
      log.error(`Error updating message statuses record: ${err.message}. Rolling back...`, { error: err, function: 'updateStatus' });
      if (trx) await trx.rollback();
      throw err;
    }
  }
}

module.exports = DataService;
