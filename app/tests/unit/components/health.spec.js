const helper = require('../../common/helper');
const healthCheck = require('../../../src/components/health');

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

describe('getSmtpHealth', () => {
  afterEach(() => {
    mockConnFn.mockClear();
  });

  it('should return host on valid connection', async () => {
    mockConnFn.mockImplementation(async () => {
      return true;
    });

    const result = await healthCheck.getSmtpHealth();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('smtp');
    expect(result.healthy).toBeTruthy();
    expect(result.info).toBeTruthy();
    expect(result.info).toMatch('SMTP Service connected successfully.');
  });

  it('should log an error if there is a failure', async () => {
    mockConnFn.mockImplementation(async () => {
      throw new Error('bad');
    });

    const result = await healthCheck.getSmtpHealth();

    expect(result.name).toMatch('smtp');
    expect(result.healthy).toBeFalsy();
    expect(result.info).toBeTruthy();
    expect(result.info).toMatch('bad');
  });
});
