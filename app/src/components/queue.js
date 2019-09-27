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

const queue = {
  /** Adds an email message to the queue
   *  @param {object} message An email message object
   *  @param {object} opts Bull job queue options to override default behavior.
   *      Refer to the JobOpts interface at https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd.
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

  getMessage: async msgId => await chesQueue.getJob(msgId),

  /** Cleanup message data upon job completion
   *  @param {object} job A Bull Queue Job object
   */
  onCompleted: async job => {
    log.info('queue', `Job ${job.id} completed`);
    await job.update(null); // Scrub out message information on finish
  },

  /** Log the job error upon encountering an error
   *  @param {object} job A Bull Queue Job object
   */
  onError: async job => {
    if (typeof job.id !== 'undefined') {
      log.error('queue', `Job ${job.id} errored`);
    } else {
      log.error('queue', 'A Job failed');
    }
  },

  /** Cleanup message data upon job failure
   *  @param {object} job A Bull Queue Job object
   */
  onFailed: async job => {
    log.error('queue', `Job ${job.id} failed`);
    await job.update(null); // Scrub out message information on finish
  },

  /** Execute the message job task
   *  @param {object} job A Bull Queue Job object
   */
  onProcess: async job => {
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
  },

  /** The Raw Queue Object */
  queue: chesQueue
};

// Register Queue Events
chesQueue.process(queue.onProcess);
chesQueue.on('completed', queue.onCompleted);
chesQueue.on('error', queue.onError);
chesQueue.on('failed', queue.onFailed);

module.exports = queue;
