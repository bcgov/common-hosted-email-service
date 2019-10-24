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
   *  @description Transforms a Message model from the db into a StatusResponse API object
   *
   *  @param {object} msg - a Message model object
   *  @returns {object} StatusResponse
   *  @see Message
   */
  static status(msg) {
    const result = {
      createdTimestamp: msg.createdAt ? moment.utc(msg.createdAt).valueOf() : undefined,
      delayTS: msg.delayTimestamp ? moment.utc(Number(msg.delayTimestamp)).valueOf() : undefined,
      msgId: msg.messageId ? msg.messageId : undefined,
      status: msg.status ? msg.status : undefined,
      statusHistory: msg.statusHistory ? msg.statusHistory.map(h => {
        return {
          description: h.description,
          status: h.status,
          timestamp: moment.utc(h.createdAt).valueOf()
        };
      }) : undefined,
      tag: msg.tag ? msg.tag : undefined,
      txId: msg.transactionId ? msg.transactionId : undefined,
      updatedTimestamp: msg.updatedAt ? moment.utc(msg.updatedAt).valueOf() : undefined
    };
    return result;
  }
}

module.exports = Transformer;
