const db = require('../models');

module.exports = {
  async findByMsgId(msgId) {
    return await db.message.findByPk(msgId);
  },

  async findByTxId(txId) {
    return await db.message.findAll({
      where: {
        txId: txId
      }
    });
  },

  async findByTag(tag) {
    return await db.message.findAll({
      where: {
        tag: tag
      }
    });
  }
};
