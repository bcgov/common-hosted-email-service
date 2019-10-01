const nodemailer = require('nodemailer');

const helper = require('../../common/helper');
const email = require('../../../src/components/email');
const utils = require('../../../src/components/utils');

helper.logHelper();

jest.mock('nodemailer');
jest.mock('../../../src/components/queue');
jest.mock('../../../src/components/utils');

// Constant Fixtures
const body = 'body {{ foo }}';
const errorMessage = 'failed';
const subject = 'subject {{ foo }}';
const url = 'https://example.com';

// Object Fixtures
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
