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
      createdTS: msg.createdAt ? moment.utc(msg.createdAt).valueOf() : null,
      delayTS: msg.delayTimestamp ? moment.utc(Number(msg.delayTimestamp)).valueOf() : null,
      msgId: msg.messageId ? msg.messageId : null,
      status: msg.status ? msg.status : null,
      statusHistory: msg.statusHistory ? msg.statusHistory.map(h => {
        return {
          description: h.description,
          status: h.status,
          timestamp: moment.utc(h.createdAt).valueOf()
        };
      }) : [],
      tag: msg.tag ? msg.tag : null,
      txId: msg.transactionId ? msg.transactionId : null,
      updatedTS: msg.updatedAt ? moment.utc(msg.updatedAt).valueOf() : null
    };

    return utils.dropUndefinedObject(result);
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
      messages: trxn.messages ? trxn.messages.map(m => {
        return {
          msgId: m.messageId ? m.messageId : null,
          to: (m.email && m.email.to) ? m.email.to : null
        };
      }) : [],
      txId: trxn.transactionId ? trxn.transactionId : null
    };

    return result;
  },
};

module.exports = transformer;
