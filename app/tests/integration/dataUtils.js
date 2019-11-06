const log = require('npmlog');
const { transaction } = require('objection');

const Message = require('../../src/services/models/message');
const Queue = require('../../src/services/models/queue');
const Status = require('../../src/services/models/status');
const Statistic = require('../../src/services/models/statistic');
const Trxn = require('../../src/services/models/trxn');

/**
 * deleteTransactionsByClient
 * Utility function to clean up test data by client.
 * @function
 * @param {string} client - The client name...
 */
async function deleteTransactionsByClient(client) {
  if (!client) {
    throw Error('Cannot delete transactions by client without providing a client name.');
  }
  let trx;
  try {
    trx = await transaction.start(Trxn.knex());

    const trxnQuery = Trxn.query(trx)
      .select('transactionId')
      .where('client', 'like', `%${client}%`);

    const msgsQuery = Message.query(trx)
      .select('messageId')
      .whereIn('transactionId', trxnQuery);

    const qItems = await Queue.query(trx).delete().whereIn('messageId', msgsQuery);
    log.info(`Deleted ${qItems} queue records...`);
    const sItems = await Status.query(trx).delete().whereIn('messageId', msgsQuery);
    log.info(`Deleted ${sItems} status records...`);
    const mItems = await Message.query(trx).delete().whereIn('transactionId', trxnQuery);
    log.info(`Deleted ${mItems} message records...`);
    const tItems = await Trxn.query(trx).delete().where('client', 'like', `%${client}%`);
    log.info(`Deleted ${tItems} transaction records...`);

    await trx.commit();
  } catch (err) {
    log.error(`Error deleting transaction records: ${err.message}. Rolling back,..`);
    log.error(err);
    if (trx) await trx.rollback();
    throw err;
  }
}

async function countStatisticsByClient(client) {
  if (!client) {
    throw Error('Cannot count statistics by client without providing a client name.');
  }
  try {
    const items = await Statistic.query().where('client', 'like', `%${client}%`);
    log.info(`Counted ${items.length} statistic records...`);
    return items.length;
  } catch (err) {
    log.error(`Error counting statistic records: ${err.message}. Rolling back,..`);
    log.error(err);
    throw err;
  }
}

async function deleteStatisticsByClient(client) {
  if (!client) {
    throw Error('Cannot delete statistics by client without providing a client name.');
  }
  let trx;
  try {
    trx = await transaction.start(Statistic.knex());

    const items = await Statistic.query(trx).delete().where('client', 'like', `%${client}%`);
    log.info(`Deleted ${items} statistic records...`);

    await trx.commit();
  } catch (err) {
    log.error(`Error deleting statistic records: ${err.message}. Rolling back,..`);
    log.error(err);
    if (trx) await trx.rollback();
    throw err;
  }
}

module.exports = { countStatisticsByClient, deleteStatisticsByClient, deleteTransactionsByClient };
