const moment = require('moment');

/** @module transform
 *
 *  @exports transformer - transform data service models to api models
 */

class Transformer {
  
  /** @function transaction
   *  @param {object} trxn - a Fully inflated Trxn
   *
   *  transform a Trxn model from the db into TransactionResponse for the api
   *
   *  Returns TransactionResponse
   *  @see Trxn
   */
  static transaction (trxn) {
    const result = {
      txId: trxn.transactionId
    };
    result.messages = trxn.messages.map(m => {
      return {
        msgId: m.messageId,
        to: m.email.to
      };
    });
    return result;
  }
  
  /** @function status
   *  @param {object} msg - a Fully inflated Message
   *  @param {boolean} includeHistory - if true, return the status history array.
   *
   *  transform a Message model from the db into StatusResponse for the api
   *
   *  Returns StatusResponse
   *  @see Message
   */
  static status (msg, includeHistory = false) {
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
}

module.exports = Transformer;
