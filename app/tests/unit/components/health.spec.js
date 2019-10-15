const helper = require('../../common/helper');
const health = require('../../../src/components/health');

helper.logHelper();

jest.mock('../../../src/services/emailConn', () => {
  return jest.fn().mockImplementation(() => {
    return {
      checkConnection: async () => {
        return true;
      },
      host: 'https://thehost.ca'
    };
  });
});

describe('getSmtpStatus', () => {
  
  it('should return host on valid connection', async () => {
    
    const result = await health.getSmtpStatus();
    expect(result).toBeTruthy();
    expect(result.name).toMatch('SMTP Endpoint');
    expect(result.endpoint).toMatch('https://thehost.ca');
    expect(result.authenticated).toBeTruthy();
    expect(result.authorized).toBeTruthy();
    expect(result.healthCheck).toBeTruthy();
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
