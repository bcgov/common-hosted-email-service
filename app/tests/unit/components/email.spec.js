const config = require('config');
const log = require('npmlog');
const nodemailer = require('nodemailer');

const email = require('../../../src/components/email');
const queue = require('../../../src/components/queue');
const utils = require('../../../src/components/utils');

log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, {
  fg: 'cyan'
});

jest.mock('nodemailer');
jest.mock('../../../src/components/queue');
jest.mock('../../../src/components/utils');

// Constant Fixtures
const body = 'body {{ foo }}';
const errorMessage = 'failed';
const subject = 'subject {{ foo }}';
const url = 'https://example.com';

// Object Fixtures
const contextEntry = {
  'to': [
    'bar@example.com'
  ],
  'cc': [
    'baz@example.com'
  ],
  'bcc': [
    'foo@example.com',
    'fizz@example.com'
  ],
  'context': {
    'foo': 'test'
  }
};
const envelope = {
  text: body,
  encoding: 'utf-8',
  from: 'foo@example.com',
  priority: 'normal',
  to: [
    'bar@example.com'
  ],
  subject: subject
};
const info = {
  messageId: '<b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>',
  url: url
};
const message = {
  attachments: undefined,
  bcc: [],
  bodyType: 'text',
  body: body,
  cc: [],
  encoding: 'utf-8',
  from: 'foo@example.com',
  priority: 'normal',
  to: [
    'bar@example.com'
  ],
  subject: subject
};
const template = {
  attachments: undefined,
  bodyType: 'text',
  body: body,
  'contexts': [
    contextEntry,
    contextEntry
  ],
  encoding: 'utf-8',
  from: 'foo@example.com',
  priority: 'normal',
  subject: subject
};

describe('createEnvelope', () => {
  afterEach(() => {
    utils.filterUndefinedAndEmpty.mockReset();
  });

  it('should convert body field to the specified bodyType', () => {
    utils.filterUndefinedAndEmpty.mockReturnValue(message);

    const result = email.createEnvelope(message);
    expect(result).toBeTruthy();
    expect(result.bodyType).toBeUndefined();
    expect(result.text).toMatch(body);
  });
});

describe('mergeMailEthereal', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(email, 'sendMailEthereal');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should yield an array of Ethereal email urls', async () => {
    spy.mockResolvedValue(url);

    const result = await email.mergeMailEthereal(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(url);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if any sending failed', async () => {
    spy.mockResolvedValueOnce(url);
    spy.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    expect(email.mergeMailEthereal(template)).rejects.toThrow(errorMessage);
  });
});

describe('mergeMailSmtp', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(email, 'queueMailSmtp');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should yield an array of nodemailer result objects', async () => {
    spy.mockResolvedValue(info);

    const result = await email.mergeMailSmtp(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if any sending failed', async () => {
    spy.mockResolvedValueOnce(info);
    spy.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    expect(email.mergeMailSmtp(template)).rejects.toThrow(errorMessage);
  });
});

describe('mergeTemplate', () => {
  it('should yield an array of message objects', () => {
    const result = email.mergeTemplate(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(result[0].body).toMatch('body test');
    expect(result[0].to).toBeTruthy();
    expect(result[0].subject).toMatch('subject test');
  });
});

describe('queueMailSmtp', () => {
  const id = 'uuidString';
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(queue, 'enqueue');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should yield an id for the queue transaction', () => {
    spy.mockReturnValue(id);
    const result = email.queueMailSmtp(message);
    expect(result).toBeTruthy();
    expect(result.messageId).toBeTruthy();
    expect(result.messageId).toMatch(id);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('renderMerge', () => {
  const str = 'Hello {{ foo }}';
  const context = {
    foo: 'test'
  };

  it('should yield a rendered merge string', () => {
    const result = email.renderMerge(str, context);
    expect(result).toBeTruthy();
    expect(result).toMatch('Hello test');
  });

  it('should throw an error on an unrecognized dialect', () => {
    const dialect = 'badDialect';
    const result = () => email.renderMerge(str, context, dialect);
    expect(result).toBeTruthy();
    expect(result).toThrow(`Dialect ${dialect} not supported`);
  });
});

describe('sendMail', () => {
  beforeEach(() => {
    email.createEnvelope = jest.fn().mockReturnValue(envelope);
  });

  afterEach(() => {
    email.createEnvelope.mockReset();
    nodemailer.createTransport.mockReset();
  });

  it('should send a message with the provided transporter', () => {
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({})
    });
    const transport = nodemailer.createTransport({});

    const result = email.sendMail(transport, message);
    expect(result).toBeTruthy();
  });

  it('should throw an error if sending failed', () => {
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn(() => {
        throw new Error(errorMessage);
      })
    });
    const transport = nodemailer.createTransport({});
    expect(email.sendMail(transport, message)).rejects.toThrow(errorMessage);
  });
});

describe('sendMailEthereal', () => {
  const testAccount = {
    smtp: {
      host: 'host',
      port: 25
    },
    user: 'user',
    pass: 'pass'
  };

  beforeEach(() => {
    nodemailer.createTestAccount.mockResolvedValue(testAccount);
    nodemailer.createTransport.mockReturnValue({});
    nodemailer.getTestMessageUrl.mockReturnValue(url);
  });

  afterEach(() => {
    nodemailer.createTestAccount.mockReset();
    nodemailer.createTransport.mockReset();
    nodemailer.getTestMessageUrl.mockReset();
  });

  it('should yield an Ethereal email url', () => {
    email.sendMail = jest.fn().mockResolvedValue(info);

    const result = email.sendMailEthereal(message);
    expect(result).toBeTruthy();
  });

  it('should throw an error if sending failed', () => {
    email.sendMail = jest.fn(() => {
      throw new Error(errorMessage);
    });

    expect(email.sendMailEthereal(message)).rejects.toThrow(errorMessage);
  });
});

describe('sendMailSmtp', () => {
  afterEach(() => {
    nodemailer.createTransport.mockReset();
  });

  it('should yield a nodemailer result object', () => {
    email.sendMail = jest.fn().mockResolvedValue(info);

    nodemailer.createTransport.mockReturnValue({});

    const result = email.sendMailSmtp(message);
    expect(result).toBeTruthy();
  });

  it('should throw an error if sending failed', () => {
    email.sendMail = jest.fn(() => {
      throw new Error(errorMessage);
    });

    nodemailer.createTransport.mockReturnValue({});
    expect(email.sendMailSmtp(message)).rejects.toThrow(errorMessage);
  });
});
