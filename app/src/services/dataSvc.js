/**
 * @module DataService
 *
 * Service to persist data.
 *
 *
 * @see DataConnection
 * @see Objection
 * @see knex
 *
 * @exports DataService
 */
const log = require('npmlog');
const { Model } = require('objection');
const { transaction } = require('objection');
const uuidv4 = require('uuid/v4');

const DataConnection = require('./dataConn');

const Message = require('./models/message');
const Queue = require('./models/queue');
const Status = require('./models/status');
const Trxn = require('./models/trxn');

/** @function createMessage
 *  inserts all message related data into the db for a Trxn (transaction)
 *  inserts an initial status record.
 *  @param {string} transactionId - transaction parent record
 *  @param {object} msg - API email message object
 *  @param {object} db - an Objection/Knex transaction for commit/rollback
 *  @returns Message
 */
const createMessage = async (transactionId, msg, db) => {
  const messageObj = await Message.query(db).insert({
    messageId: uuidv4(),
    transactionId: transactionId,
    tag: msg.tag,
    email: msg,
    delayTimestamp: msg.delayTS
  });

  await Status.query(db).insert({
    messageId: messageObj.messageId
  });

  return messageObj;
};

/** @function queueToBusinessStatus
 *  Not all transitions in the queue processing are relevant to business.
 *  Translate a queue processing status into a  business status.
 *
 *  @param {string} queueStatus - status message from queue
 *  @returns {string} a business status (stored in Status)
 */
const queueToBusinessStatus = (queueStatus) => {
  // we have no mapping yet, so just track them all...
  return queueStatus;
};

class DataService {

  /**
   * Creates a new DataService with default connection.
   * @class
   */
  constructor () {
    this.connection = new DataConnection();
  }

  /** @function connection
   *  Gets the current DataConnection
   */
  get connection () {
    return this._connection;
  }

  /** @function connection
   *  Sets the current DataConnection
   *  @param {object} v - an DataConnection
   */
  set connection (v) {
    this._connection = v;
  }

  /** @function createTransaction
   *  Creates a Trxn (transaction) record with associated messages
   *
   *  @param {string} client- the authorized party / client
   *  @param {object} msg - the API email message or template.
   *  @returns {object} Trxn object, fully populated with child messages and status
   */
  async createTransaction (client, msg) {
    if (!msg) {
      throw Error('Transaction cannot be created with email message(s)');
    }
    let trx;
    try {
      trx = await transaction.start(Trxn.knex());
      const transactionId = uuidv4();

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

      return await this.readTransaction(client, transactionId);
    } catch (err) {
      log.error(`Error creating transaction record: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }

  /** @function deleteMessageEmail
   *  Deletes the email data from a message.
   *  We don't want to retain any private-ish data longer than required to perform our task.
   *
   *  @param {string} client- the authorized party / client
   *  @param {string} messageId - the id of the message we want to purge email
   *  @throws NotFoundError if message for client not found
   *  @returns {object} Message object, fully populated.
   */
  async deleteMessageEmail (client, messageId) {
    let trx;
    try {
      // first query for message, throw not found if client/message not exist...
      await this.readMessage(client, messageId);

      trx = await transaction.start(Message.knex());
      const cItems = await Message.query(trx)
        .patch({ email: null })
        .where('messageId', messageId);
      log.info(`Updated ${cItems} message email records...`);

      await trx.commit();

      return this.readMessage(client, messageId);
    } catch (err) {
      log.error(`Error updating message (email) record: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }

  // find transactions (by id, by client, by message state)
  // find messages (by id, by client, by message state)
  // find messages (by id, by client, by message state)

  /** @function readMessage
   *  Read a Message from the db
   *
   *  @param {string} client - the authorized party / client
   *  @param {string} messageId - the id of the message we want
   *  @throws NotFoundError if message for client not found
   *  @returns {object} Message object, fully populated.
   */
  async readMessage (client, messageId) {
    const trxnQuery = Trxn.query()
      .select('transactionId')
      .where('client', client);

    return Message.query()
      .findById(messageId)
      .whereIn('transactionId', trxnQuery)
      .eagerAlgorithm(Model.JoinEagerAlgorithm)
      .eager({
        statusHistory: true,
        queueHistory: true
      })
      .modifyEager('statusHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      })
      .modifyEager('queueHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      }).throwIfNotFound();
  }

  /** @function readTransaction
   *  Read a Transaction (Trxn) from the db
   *
   *  @param {string} client - the authorized party / client
   *  @param {string} transactionId - the id of the transaction we want
   *  @throws NotFoundError if transaction for client not found
   *  @returns {object} Trxn object, fully populated.
   */
  async readTransaction (client, transactionId) {
    return Trxn.query()
      .findById(transactionId)
      .where('client', client)
      .eagerAlgorithm(Model.JoinEagerAlgorithm)
      .eager({
        messages: {
          statusHistory: true,
          queueHistory: true
        }
      })
      .modifyEager('messages.statusHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      })
      .modifyEager('messages.queueHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      }).throwIfNotFound();
  }

  /** @function updateMessageSendResult
   *  Updates the message's send result field.
   *  The send result is populated once the email has been sent.
   *
   *  @param {string} client- the authorized party / client
   *  @param {string} messageId - the id of the message
   *  @param {object} sendResult - the pared down SMTP result
   *  @throws NotFoundError if message for client not found
   *  @returns {object} Message object, fully populated.
   */
  async updateMessageSendResult (client, messageId, sendResult) {
    let trx;
    try {
      // first query for message, throw not found if client/message not exist...
      await this.readMessage(client, messageId);

      trx = await transaction.start(Message.knex());
      const cItems = await Message.query(trx)
        .patch({ sendResult: sendResult })
        .where('messageId', messageId);
      log.info(`Updated ${cItems} message (result) records...`);

      await trx.commit();

      return await this.readMessage(client, messageId);
    } catch (err) {
      log.error(`Error updating message send result record: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }

  /** @function updateStatus
   *  Updates the message's current status.
   *  Add a new queue processing status (Queue) record.
   *  Determine the business status and if required, add a new business status (Status) record.
   *
   *  @param {string} client- the authorized party / client
   *  @param {string} messageId - the id of the message we want to purge email content
   *  @param {string} status - the queue processing status
   *  @param {string} description - optional description, mostly used for error/failure statuses
   *  @throws NotFoundError if message for client not found
   *  @returns {object} Message object, fully populated.
   */
  async updateStatus (client, messageId, status, description) {
    let trx;
    try {
      // first query for message, throw not found if client/message not exist...
      const msg = await this.readMessage(client, messageId);

      trx = await transaction.start(Message.knex());

      const businessStatus = queueToBusinessStatus(status);
      if (msg.status !== businessStatus) {
        // we are changing business statuses... so update and add new status history
        await msg.$query(trx).patch({ status: businessStatus });
        await Status.query(trx).insert({
          messageId: messageId,
          status: status,
          description: description
        });
      }

      // always add the queue status...
      await Queue.query(trx).insert({
        messageId: messageId,
        status: status,
        description: description
      });

      await trx.commit();

      return await this.readMessage(client, messageId);
    } catch (err) {
      log.error(`Error updating message statuses record: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }
}

module.exports = DataService;
