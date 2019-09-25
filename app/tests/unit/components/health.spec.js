const config = require('config');
const log = require('npmlog');
const nodemailer = require('nodemailer');

const health = require('../../../src/components/health');

log.level = config.get('server.logLevel');

jest.mock('nodemailer');

describe('getSmtpStatus', () => {
  const invalidHost = 'bad.url.com';
  const validHost = config.get('server.smtpHost');
  const name = 'SMTP Endpoint';

  afterEach(() => {
    nodemailer.createTransport.mockReset();
  });

  it('should connect to SMTP server successfully', async () => {
    nodemailer.createTransport.mockReturnValue({
      verify: jest.fn().mockResolvedValue()
    });

    const result = await health.getSmtpStatus(validHost);
    expect(result).toBeTruthy();
    expect(result.name).toMatch(name);
    expect(result.endpoint).toMatch(`https://${validHost}`);
    expect(result.authenticated).toBeTruthy();
    expect(result.authorized).toBeTruthy();
    expect(result.healthCheck).toBeTruthy();
  });

  it('should error when connecting to non-existent SMTP server', async () => {
    nodemailer.createTransport.mockReturnValue({
      'verify': jest.fn().mockRejectedValue({'message': `getaddrinfo ENOTFOUND ${invalidHost}`})
    });

    const result = await health.getSmtpStatus(invalidHost);
    expect(result).toBeTruthy();
    expect(result.name).toMatch(name);
    expect(result.endpoint).toMatch(`https://${invalidHost}`);
    expect(result.authenticated).toBeFalsy();
    expect(result.authorized).toBeFalsy();
    expect(result.healthCheck).toBeFalsy();
  });
});

describe('getStatus', () => {
  afterEach(() => {
    health.getSmtpStatus.mockReset();
  });

  it('should yield an array of statuses', async () => {
    health.getSmtpStatus = jest.fn().mockResolvedValue({});

    const result = await health.getStatus();
    expect(result).toBeTruthy();
    expect(result.length).toEqual(1);
  });
});
