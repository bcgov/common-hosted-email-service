const Bull = require('bull');
const log = require('npmlog');
const uuidv4 = require('uuid/v4');

const email = require('./email');

const chesQueue = new Bull('ches');

chesQueue.process(async job => {
  log.info('queue', `Job ${job.id} is processing...`);

  try {
    if (job.data.message) {
      const result = await email.sendMailSmtp(job.data.message);
      job.log(JSON.stringify(result));
      return result;
    } else {
      throw new Error('Message missing or formatted incorrectly');
    }
  } catch (error) {
    job.log(error.message);
  }
});

chesQueue.on('completed', async job => {
  log.info('queue', `Job ${job.id} completed`);
});

chesQueue.on('error', async job => {
  log.error('queue', `Job ${job.id} errored`);
  await job.retry();
});

chesQueue.on('failed', async job => {
  log.error('queue', `Job ${job.id} failed`);
});

const queue = {
  enqueue: (message, opts) => {
    const id = uuidv4();
    chesQueue.add({
      message: message
    }, Object.assign(opts, {
      jobId: id
    }));

    return id;
  },

  queue: chesQueue
};

module.exports = queue;
