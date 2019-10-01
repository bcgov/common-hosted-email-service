const queue = require('./queue');
const utils = require('./utils');

const status = {
  getMessageId: async msgId => {
    const job = await queue.getMessage(msgId);
    if (!job) {
      return null;
    }

    const status = await job.getState();
    const result = {
      delayTS: utils.calculateDelayTS(job.opts.timestamp, job.opts.delay),
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
