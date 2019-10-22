const moment = require('moment');

/** @module transform
 *
 *  @exports transformer - transform data service models to api models
 */

class Transformer {

  /** @function transaction
   *  @description Transforms a Trxn model from the db into TransactionResponse for the api
   *
   *  @param {object} trxn - a Fully inflated Trxn
   *  @returns TransactionResponse
   *  @see Trxn
   */
  static transaction(trxn) {
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
   *  @description Transforms a Message model from the db into StatusResponse for the api
   *
   *  @param {object} msg - a Fully inflated Message
   *  @returns StatusResponse
   *  @see Message
   */
  static status(msg) {
    const delayTS = msg.delayTimestamp ? moment.utc(Number(msg.delayTimestamp)).valueOf() : null;
    const result = {
      createdTimestamp: moment.utc(msg.createdAt).valueOf(),
      delayTS: delayTS,
      msgId: msg.messageId,
      status: msg.status,
      statusHistory: msg.statusHistory.map(h => {
        return {
          description: h.description,
          status: h.status,
          timestamp: moment.utc(h.createdAt).valueOf()
        };
      }),
      tag: msg.tag,
      txId: msg.transactionId,
      updatedTimestamp: moment.utc(msg.updatedAt).valueOf()
    };
    return result;
  }
}

module.exports = Transformer;
