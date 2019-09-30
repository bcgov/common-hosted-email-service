const queueComponent = require('./queue');

const status = {
  getMessageId: async msgId => {
    const job = await queueComponent.getMessage(msgId);
    if (!job) {
      return null;
    }

    const status = await job.getState();
    const result = {
      delayTS: job.timestamp + job.delay,
      msgId: job.id,
      status: status,
      timestamp: job.timestamp,
      tag: undefined,
      txId: '00000000-0000-0000-0000-000000000000'
    };

    if (status === 'completed') {
      result.result = {
        smtpMsgId: job.returnvalue.messageId || undefined,
        response: job.returnvalue.response || undefined
      };
    }

    // TODO: Add failed case

    return result;
  }
};

module.exports = status;
