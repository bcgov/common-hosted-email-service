const Bull = require('bull');
const config = require('config');
const log = require('npmlog');
const uuidv4 = require('uuid/v4');

const email = require('./email');

const chesQueue = new Bull('ches', {
  redis: {
    host: config.get('redis.host'),
    password: config.get('redis.password')
  }
});

chesQueue.process(async job => {
  log.info('queue', `Job ${job.id} is processing...`);

  try {
    if (job.data.message) {
      const result = await email.sendMailSmtp(job.data.message);
      await job.log(JSON.stringify(result));
      return result;
    } else {
      throw new Error('Message missing or formatted incorrectly');
    }
  } catch (error) {
    await job.log(error.message);
    await job.moveToFailed({
      message: error.message
    }, true);
    await job.finished();
  }
});

chesQueue.on('completed', async job => {
  log.info('queue', `Job ${job.id} completed`);
  await job.update(null); // Scrub out message information on finish
});

chesQueue.on('error', async job => {
  if (typeof job.id !== 'undefined') {
    log.error('queue', `Job ${job.id} errored`);
  }
});

chesQueue.on('failed', async job => {
  log.error('queue', `Job ${job.id} failed`);
  await job.update(null); // Scrub out message information on finish
});

const queue = {
  /** Adds an email message to the queue
   *  @param {object} message An email message object
   *  @param {object} opts Bull job queue options to override default behavior. For more details on this object structure, refer to the JobOpts interface at https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd.
   *  @returns {string} A uuid corresponding to the queued message
   */
  enqueue: (message, opts = {}) => {
    const id = uuidv4();
    chesQueue.add({
      message: message
    }, Object.assign(opts, {
      jobId: id
    }));

    log.info('enqueue', `Job ${id} enqueued`);
    return id;
  },

  queue: chesQueue
};

module.exports = queue;
