const log = require('npmlog');
const moment = require('moment');

/**
 * @module transform
 *
 * @exports transformer - Transforms between Data Service Models and API Models
 */
const transformer = {
  /**
   * @function toStatusResponse
   * @description Transforms a Message model from the db into a StatusResponse API object
   *
   * @param {object} msg - a Message model object
   * @returns {object} StatusResponse
   * @see Message
   */
  toStatusResponse: msg => {
    const result = {
      createdTS: msg.createdAt ? moment.utc(msg.createdAt).valueOf() : null,
      delayTS: msg.delayTimestamp ? moment.utc(Number(msg.delayTimestamp)).valueOf() : null,
      msgId: msg.messageId ? msg.messageId : null,
      smtpResponse: msg.sendResult ? msg.sendResult : null,
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

    return result;
  },

  /**
   * @function toTransactionResponse
   * @description Transforms a Trxn model from the db into TransactionResponse API object
   *
   * @param {object} trxn - a Trxn model object
   * @returns TransactionResponse
   * @see Trxn
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


  /**
   * @function transactionToStatistics
   * @description Transforms a Trxn model from the db into Statistic model objects
   *
   * @param {string} client - the client / authorized party
   * @param {object} trxn - a Trxn model object
   * @returns array of Statistic model objects
   * @see Statistic
   */
  transactionToStatistics: (client, trxn) => {
    if (!client) return [];
    const result = [];
    if (trxn && trxn.messages) {
      trxn.messages.forEach((m) => {
        let delay = null;
        if (moment.utc(m.createdAt).isBefore(moment.utc(Number(m.delayTimestamp)))) {
          delay = new Date(Number(m.delayTimestamp));
        }
        const stat = {
          client: client,
          operation: 'TRANSACTION_CREATE',
          transactionId: trxn.transactionId,
          messageId: m.messageId,
          status: m.status,
          timestamp: m.createdAt,
          delay: delay
        };
        result.push(stat);
      });
    }
    return result;
  },

  /**
   * @function messageToStatistics
   * @description Transforms a Message model from the db into Statistic model objects
   *
   * @param {string} client - the client / authorized party
   * @param {object} msg - a Message model object
   * @returns array of Statistic model objects
   * @see Statistic
   */
  messageToStatistics: (client, msg) => {
    if (!client || !msg) return [];
    const result = [];
    let delay = null;
    if (moment.utc(msg.updatedAt).isBefore(moment.utc(Number(msg.delayTimestamp)))) {
      delay = new Date(Number(msg.delayTimestamp));
    }
    const stat = {
      client: client,
      operation: 'STATUS_UPDATE',
      transactionId: msg.transactionId,
      messageId: msg.messageId,
      status: msg.status,
      timestamp: msg.updatedAt,
      delay: delay
    };
    result.push(stat);
    return result;
  },


  /**
   * @function mailApiToStatistics
   * @description Transforms a Mail API result (string) into Statistic model objects
   *
   * @param {string} s - the mail api log string
   * @returns array of Statistic model objects
   * @see Statistic
   */
  mailApiToStatistics: (s) => {
    if (!s || s.trim().length === 0) return [];
    let result = [];
    try {
      const tokens = s.trim().split(' ');
      const msgIds = tokens[3].split(',');
      const ts = new Date(Number(tokens[4]));
      msgIds.forEach((m) => {
        result.push({
          client: tokens[0],
          operation: tokens[1],
          transactionId: tokens[2],
          messageId: m,
          status: '-',
          timestamp: ts,
          delay: null
        });
      });
    } catch (err) {
      log.error('mailApiToStatistics', err);
    }

    return result;
  }
};

module.exports = transformer;
