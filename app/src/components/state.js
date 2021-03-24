/**
 * @enum {string} queueState
 * @description Queue State Constants
 * @readonly
 * @property {string} ACCEPTED - Message is acceptable and job ids are assigned
 * @property {string} COMPLETED - Message job finished executing - terminal state
 * @property {string} DELIVERED - Message has been delivered to SMTP server
 * @property {string} ENQUEUED - Message has been added to the queue
 * @property {string} FAILED - Message had an error during processing - terminal state
 * @property {string} PROCESSING - Message is being handled
 * @property {string} PROMOTED - Message has been promoted and will be processed soon
 * @property {string} REMOVED - Message removed from queue by client request
 */
const queueState = Object.freeze({
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  ERRORED: 'errored',
  ENQUEUED: 'enqueued',
  FAILED: 'failed',
  PROCESSING: 'processing',
  PROMOTED: 'promoted',
  REMOVED: 'removed'
});

/**
 * @enum {string} statusState
 * @description Business Status State Constants
 * @readonly
 * @property {string} ACCEPTED - Message is acceptable and job ids are assigned
 * @property {string} CANCELLED - Message was cancelled by client request
 * @property {string} COMPLETED - Message job finished executing - terminal state
 * @property {string} FAILED - Message had an error during processing - terminal state
 * @property {string} PENDING - Message is waiting to be processed
 */
const statusState = Object.freeze({
  ACCEPTED: 'accepted',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING: 'pending'
});

/**
 * @function queueToStatus
 * @description Not all transitions in the queue processing are relevant to business.
 * Translate a queue status into a business status.
 *
 * @param {string} queueStatus - status from queue
 * @throws NotValidStatus if `queueStatus` is invalid
 * @returns {string} a business status (stored in Status)
 */
function queueToStatus(queueStatus) {
  const map = new Map([
    [queueState.ACCEPTED, statusState.ACCEPTED],
    [queueState.COMPLETED, statusState.COMPLETED],
    [queueState.DELIVERED, statusState.PENDING],
    [queueState.ERRORED, statusState.PENDING],
    [queueState.ENQUEUED, statusState.PENDING],
    [queueState.FAILED, statusState.FAILED],
    [queueState.PROCESSING, statusState.PENDING],
    [queueState.PROMOTED, statusState.PENDING],
    [queueState.REMOVED, statusState.CANCELLED]
  ]);

  if (!map.has(queueStatus)) throw new Error('NotValidStatus');
  return map.get(queueStatus);
}

module.exports = { queueState, statusState, queueToStatus };
