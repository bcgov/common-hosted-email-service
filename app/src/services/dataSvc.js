const log = require('npmlog');
const { Model } = require('objection');
const { transaction } = require('objection');
const uuidv4 = require('uuid/v4');

const DataConnection = require('./dataConn');

const Content = require('./models/content');
const Message = require('./models/message');
const Queue = require('./models/queue');
const Status = require('./models/status');
const Trxn = require('./models/trxn');

const createMessage = async (transactionId, msg, db) => {
  const messageObj = await Message.query(db).insert({
    messageId: uuidv4(),
    transactionId: transactionId,
    tag: msg.tag,
    delayTimestamp: msg.delayTS
  });
  
  await Status.query(db).insert({
    messageId: messageObj.messageId
  });
  
  await Content.query(db).insert({
    messageId: messageObj.messageId,
    email: msg
  });
  
  return messageObj;
};

const queueToBusinessStatus = (queueStatus) => {
  // we have no mapping yet, so just track them all...
  return queueStatus;
};

class DataService {
  
  constructor () {
    this.connection = new DataConnection();
  }
  
  get connection () {
    return this._connection;
  }
  
  set connection (v) {
    this._connection = v;
  }
  
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
  
  async deleteContent (client, messageId) {
    if (!messageId) {
      throw Error('Cannot delete message content without providing a message id.');
    }
    let trx;
    try {
      // first query for message, throw not found if client/message not exist...
      await this.readMessage(client, messageId);

      trx = await transaction.start(Content.knex());
      const cItems = await Content.query(trx)
        .patch({ email: null })
        .where('messageId', messageId);
      log.info(`Updated ${cItems} content records...`);
      
      await trx.commit();
      
      return this.readMessage(client, messageId);
    } catch (err) {
      log.error(`Error updating content record: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }
  
  // find transactions (by id, by client, by message state)
  // find messages (by id, by client, by message state)
  // find messages (by id, by client, by message state)
  
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
        content: true,
        queueHistory: true
      })
      .modifyEager('statusHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      })
      .modifyEager('queueHistory', builder => {
        builder.orderBy('createdAt', 'desc');
      }).throwIfNotFound();
  }
  
  async readTransaction (client, transactionId) {
    return Trxn.query()
      .findById(transactionId)
      .where('client', client)
      .eagerAlgorithm(Model.JoinEagerAlgorithm)
      .eager({
        messages: {
          statusHistory: true,
          content: true,
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
      log.error(`Error updating message record: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }
}

module.exports = DataService;
