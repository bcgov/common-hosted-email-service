const helper = require('../../common/helper');
const health = require('../../../src/components/health');

helper.logHelper();

const mockConnFn = jest.fn();
jest.mock('../../../src/services/emailConn', () => {
  return jest.fn(() => {
    return {
      checkConnection: mockConnFn,
      host: 'https://thehost.ca'
    };
  });
});

describe('getSmtpStatus', () => {
  afterEach(() => {
    mockConnFn.mockClear();
  });

  it('should return host on valid connection', async () => {
    mockConnFn.mockImplementation(async () => {
      return true;
    });

    const result = await health.getSmtpStatus();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('SMTP Endpoint');
    expect(result.endpoint).toMatch('https://thehost.ca');
    expect(result.authenticated).toBeTruthy();
    expect(result.authorized).toBeTruthy();
    expect(result.healthCheck).toBeTruthy();
  });

  it('should log an error if there is a failure', async () => {
    mockConnFn.mockImplementation(async () => {
      throw new Error('bad');
    });

    const result = await health.getSmtpStatus();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('SMTP Endpoint');
    expect(result.endpoint).toMatch('https://thehost.ca');
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
