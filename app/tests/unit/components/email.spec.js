const config = require('config');
const log = require('npmlog');
const nodemailer = require('nodemailer');

const email = require('../../../src/components/email');
const utils = require('../../../src/components/utils');

log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, {
  fg: 'cyan'
});

jest.mock('nodemailer');
jest.mock('../../../src/components/utils');

const body = 'body';
const envelope = {
  text: body,
  encoding: 'utf-8',
  from: 'foo@example.com',
  priority: 'normal',
  to: [
    'bar@example.com'
  ],
  subject: 'subject'
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
  subject: 'subject'
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
        throw new Error('failed');
      })
    });
    const transport = nodemailer.createTransport({});
    expect(email.sendMail(transport, message)).rejects.toThrow();
  });
});

describe('sendMailEthereal', () => {
  const info = {
    messageId: '<b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>',
    url: 'example.com'
  };
  const testAccount = {
    smtp: {
      host: 'host',
      port: 25
    },
    user: 'user',
    pass: 'pass'
  };

  afterEach(() => {
    nodemailer.createTestAccount.mockReset();
    nodemailer.createTransport.mockReset();
    nodemailer.getTestMessageUrl.mockReset();
  });

  it('should yield an Ethereal email url', () => {
    email.sendMail = jest.fn().mockResolvedValue(info);

    nodemailer.createTestAccount.mockResolvedValue(testAccount);
    nodemailer.createTransport.mockReturnValue({});
    nodemailer.getTestMessageUrl.mockReturnValue();

    const result = email.sendMailEthereal(message);

    expect(result).toBeTruthy();
  });

  it('should throw an error if sending failed', () => {
    email.sendMail = jest.fn(() => {
      throw new Error('failed');
    });

    nodemailer.createTestAccount.mockResolvedValue(testAccount);
    nodemailer.createTransport.mockReturnValue({});
    nodemailer.getTestMessageUrl.mockReturnValue();

    expect(email.sendMailEthereal(message)).rejects.toThrow();
  });
});

describe('sendMailSmtp', () => {
  const info = {
    messageId: '<b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>',
    url: 'example.com'
  };

  afterEach(() => {
    nodemailer.createTransport.mockReset();
  });

  it('should yield an Ethereal email url', () => {
    email.sendMail = jest.fn().mockResolvedValue(info);

    nodemailer.createTransport.mockReturnValue({});

    const result = email.sendMailSmtp(message);

    expect(result).toBeTruthy();
  });

  it('should throw an error if sending failed', () => {
    email.sendMail = jest.fn(() => {
      throw new Error('failed');
    });

    nodemailer.createTransport.mockReturnValue({});

    expect(email.sendMailSmtp(message)).rejects.toThrow();
  });
});
