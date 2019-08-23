const config = require('config');
const log = require('npmlog');
const nodemailer = require('nodemailer');

const checks = require('../../../src/components/checks');

log.level = config.get('server.logLevel');

jest.mock('nodemailer');

describe('getSmtpStatus', () => {
  const invalidHost = 'bad.url.com';
  const validHost = 'apps.smtp.gov.bc.ca';
  const name = 'SMTP Endpoint';

  afterEach(() => {
    nodemailer.createTransport.mockReset();
  });

  it('should connect to SMTP server successfully', async () => {
    nodemailer.createTransport.mockReturnValue({
      'verify': jest.fn().mockResolvedValue()
    });

    const result = await checks.getSmtpStatus(validHost);
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

    const result = await checks.getSmtpStatus(invalidHost);
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
    checks.getSmtpStatus.mockReset();
  });

  it('should yield an array of statuses', async () => {
    checks.getSmtpStatus = jest.fn().mockResolvedValue({});

    const result = await checks.getStatus();
    expect(result).toBeTruthy();
    expect(result.length).toEqual(1);
  });
});
