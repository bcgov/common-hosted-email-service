const { transaction } = require('objection');

const log = require('../../src/components/log')(module.filename);
const { Message, Queue, Status, Trxn } = require('../../src/services/models');

/**
 *  @function deleteTransactionsByClient
 *  Utility function to clean up test data by client.
 *  @param {string} client - The client name...
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
      .where('client', client);

    const msgsQuery = Message.query(trx)
      .select('messageId')
      .whereIn('transactionId', trxnQuery);

    const qItems = await Queue.query(trx).delete().whereIn('messageId', msgsQuery);
    log.info(`Deleted ${qItems} queue records...`, { function: 'deleteTransactionsByClient' });
    const sItems = await Status.query(trx).delete().whereIn('messageId', msgsQuery);
    log.info(`Deleted ${sItems} status records...`, { function: 'deleteTransactionsByClient' });
    const mItems = await Message.query(trx).delete().whereIn('transactionId', trxnQuery);
    log.info(`Deleted ${mItems} message records...`, { function: 'deleteTransactionsByClient' });
    const tItems = await Trxn.query(trx).delete().where('client', 'like', `%${client}%`);
    log.info(`Deleted ${tItems} transaction records...`, { function: 'deleteTransactionsByClient' });

    await trx.commit();
  } catch (err) {
    log.error(`Error deleting transaction records: ${err.message}. Rolling back...`, { error: err, function: 'deleteTransactionsByClient' });
    if (trx) await trx.rollback();
    throw err;
  }
}

module.exports = { deleteTransactionsByClient };
