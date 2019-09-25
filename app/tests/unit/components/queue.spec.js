const config = require('config');
const log = require('npmlog');

const email = require('../../../src/components/email');
const queue = require('../../../src/components/queue');

log.level = config.get('server.logLevel');

jest.mock('bull');

const Job = jest.fn(() => {
  return {
    id: 1,
    finished: () => {},
    log: () => {},
    moveToFailed: () => {},
    update: () => {}
  };
});

describe('enqueue', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(queue.queue, 'add');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should add a message to the queue', () => {
    const message = {};
    spy.mockImplementation(() => {});

    const result = queue.enqueue(message);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('onCompleted', () => {
  it('should scrub out message information', async () => {
    const result = await queue.onCompleted(new Job());
    expect(result).toBeUndefined();
  });
});

describe('onError', () => {
  it('should log an error', async () => {
    const result = await queue.onError(new Job());
    expect(result).toBeUndefined();
  });

  it('should do nothing if job id is undefined', async () => {
    const job = new Job();
    job.id = undefined;

    const result = await queue.onError(job);
    expect(result).toBeUndefined();
  });
});

describe('onFailed', () => {
  it('should scrub out message information', async () => {
    const result = await queue.onFailed(new Job());
    expect(result).toBeUndefined();
  });
});

describe('onProcess', () => {
  beforeEach(() => {
    email.sendMailSmtp = jest.fn().mockResolvedValue({});
  });

  afterEach(() => {
    email.sendMailSmtp.mockRestore();
  });

  it('should dispatch a message through nodemailer', async () => {
    const job = new Job();
    job.data = {
      message: new Object()
    };

    const result = await queue.onProcess(job);
    expect(result).toBeTruthy();
  });

  it('should finish a job if the message is malformed', async () => {
    const job = new Job();
    job.data = {};

    const result = await queue.onProcess(job);
    expect(result).toBeUndefined();
  });

  it('should finish a job if it errors', async () => {
    const result = await queue.onProcess(new Job());
    expect(result).toBeUndefined();
  });
});
