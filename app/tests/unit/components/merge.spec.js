const config = require('config');
const log = require('npmlog');

const email = require('../../../src/components/email');
const merge = require('../../../src/components/merge');
const queue = require('../../../src/components/queue');

log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, {
  fg: 'cyan'
});

jest.mock('bull');
jest.mock('nodemailer');
jest.mock('../../../src/components/queue');

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
const info = {
  messageId: '<b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>',
  url: url
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

    const result = await merge.mergeMailEthereal(template);
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

    expect(merge.mergeMailEthereal(template)).rejects.toThrow(errorMessage);
  });
});

describe('mergeMailSmtp', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(queue, 'enqueue');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should yield an array of nodemailer result objects', async () => {
    spy.mockResolvedValue(info);

    const result = await merge.mergeMailSmtp(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if any sending failed', async () => {
    spy.mockResolvedValueOnce(info);
    spy.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    expect(merge.mergeMailSmtp(template)).rejects.toThrow(errorMessage);
  });
});

describe('mergeTemplate', () => {
  it('should yield an array of message objects', () => {
    const result = merge.mergeTemplate(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(result[0].body).toMatch('body test');
    expect(result[0].to).toBeTruthy();
    expect(result[0].subject).toMatch('subject test');
  });
});

describe('renderMerge', () => {
  const str = 'Hello {{ foo }}';
  const context = {
    foo: 'test'
  };

  it('should yield a rendered merge string', () => {
    const result = merge.renderMerge(str, context);
    expect(result).toBeTruthy();
    expect(result).toMatch('Hello test');
  });

  it('should throw an error on an unrecognized dialect', () => {
    const dialect = 'badDialect';
    const result = () => merge.renderMerge(str, context, dialect);
    expect(result).toBeTruthy();
    expect(result).toThrow(`Dialect ${dialect} not supported`);
  });
});
