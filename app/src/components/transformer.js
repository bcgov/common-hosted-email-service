const moment = require('moment');

const utils = require('./utils');

/** @module transform
 *
 *  @exports transformer - Transforms between Data Service Models and API Models
 */
const transformer = {
  /** @function status
   *  @description Transforms a Message model from the db into a StatusResponse API object
   *
   *  @param {object} msg - a Message model object
   *  @returns {object} StatusResponse
   *  @see Message
   */
  toStatusResponse: msg => {
    const result = {
      createdTimestamp: msg.createdAt ? moment.utc(msg.createdAt).valueOf() : undefined,
      delayTS: msg.delayTimestamp ? moment.utc(Number(msg.delayTimestamp)).valueOf() : undefined,
      msgId: msg.messageId,
      status: msg.status,
      statusHistory: msg.statusHistory ? msg.statusHistory.map(h => {
        return {
          description: h.description,
          status: h.status,
          timestamp: moment.utc(h.createdAt).valueOf()
        };
      }) : undefined,
      tag: msg.tag,
      txId: msg.transactionId,
      updatedTimestamp: msg.updatedAt ? moment.utc(msg.updatedAt).valueOf() : undefined
    };

    return utils.dropNullAndUndefinedObject(result);
  },

  /** @function transaction
   *  @description Transforms a Trxn model from the db into TransactionResponse API object
   *
   *  @param {object} trxn - a Trxn model object
   *  @returns TransactionResponse
   *  @see Trxn
   */
  toTransactionResponse: trxn => {
    const result = {
      messages: trxn.messages.map(m => {
        return {
          msgId: m.messageId,
          to: m.email.to
        };
      }),
      txId: trxn.transactionId
    };

    return result;
  },
};

module.exports = transformer;
