const config = require('config');
const log = require('npmlog');

const queue = require('../../../src/components/queue');
const status = require('../../../src/components/status');

log.level = config.get('server.logLevel');

jest.mock('bull');

const delay = 10000;
const msgId = 'msgId';
const timestamp = 1569500000;

describe('getMessageId', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(queue, 'getMessage');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should return null with no job found', async () => {
    spy.mockResolvedValue(null);

    const result = await status.getMessageId(msgId);
    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return a delayed status', async () => {
    const queueStatus = 'delayed';
    spy.mockResolvedValue({
      delay: delay,
      id: msgId,
      getState: jest.fn(() => queueStatus),
      timestamp: timestamp
    });

    const result = await status.getMessageId(msgId);
    expect(result).toBeTruthy();
    expect(result.delayTS).toBe(timestamp + delay);
    expect(result.msgId).toBe(msgId);
    expect(result.status).toBe(queueStatus);
    expect(result.txId).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return a completed status with result contents', async () => {
    const queueStatus = 'completed';
    spy.mockResolvedValue({
      delay: delay,
      id: msgId,
      getState: jest.fn(() => queueStatus),
      returnvalue: {
        messageId: msgId,
        response: 'response'
      },
      timestamp: timestamp
    });

    const result = await status.getMessageId(msgId);
    expect(result).toBeTruthy();
    expect(result.delayTS).toBe(timestamp + delay);
    expect(result.msgId).toBe(msgId);
    expect(result.status).toBe(queueStatus);
    expect(result.txId).toBeTruthy();
    expect(result.result).toBeTruthy();
    expect(result.result.messageId).toBe(msgId);
    expect(result.result.response).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return a completed status without result contents', async () => {
    const queueStatus = 'completed';
    spy.mockResolvedValue({
      delay: delay,
      id: msgId,
      getState: jest.fn(() => queueStatus),
      returnvalue: {},
      timestamp: timestamp
    });

    const result = await status.getMessageId(msgId);
    expect(result).toBeTruthy();
    expect(result.delayTS).toBe(timestamp + delay);
    expect(result.msgId).toBe(msgId);
    expect(result.status).toBe(queueStatus);
    expect(result.txId).toBeTruthy();
    expect(result.result).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
