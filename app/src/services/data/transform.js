const moment = require('moment');

/** @module transform
 *
 *  @exports transformer - transform data service models to api models
 */

const transformer = {
  
  /** @function transaction
   *  @param trxn - a Fully inflated Trxn
   *
   *  transform a Trxn model from the db into TransactionResponse for the api
   *
   *  Returns TransactionResponse
   */
  transaction: (trxn) => {
    const result = {
      txId: trxn.transactionId
    };
    result.messages = trxn.messages.map(m => {
      return {
        msgId: m.messageId,
        to: m.content.email.to
      };
    });
    return result;
  },
  
  status: (msg, includeHistory = false) => {
    const delayTS = msg.delayTimestamp ? moment.utc(Number(msg.delayTimestamp)).valueOf() : null;
    const result = {
      msgId: msg.messageId,
      delayTS: delayTS,
      status: msg.status,
      updatedAt: moment.utc(msg.updatedAt).valueOf()
    };
    if (includeHistory) {
      result.statuses = msg.statusHistory.map(h => {
        return {
          status: h.status,
          description: h.description,
          createdAt: moment.utc(h.createdAt).valueOf()
        };
      });
    }
    return result;
  }
};

module.exports = { transformer };
