const healthCheck = require('../../../src/components/health');

const mockConnFn = jest.fn();
jest.mock('../../../src/services/dataConn', () => {
  return jest.fn(() => {
    return {
      checkConnection: mockConnFn
    };
  });
});
jest.mock('../../../src/services/queueConn', () => {
  return jest.fn(() => {
    return {
      checkConnection: mockConnFn
    };
  });
});
jest.mock('../../../src/services/emailConn', () => {
  return jest.fn(() => {
    return {
      checkConnection: mockConnFn,
      host: 'https://thehost.ca'
    };
  });
});

describe('getDataHealth', () => {
  beforeEach(() => {
    mockConnFn.mockClear();
  });

  it('should return an object with a successful connection', async () => {
    mockConnFn.mockImplementation(async () => {
      return true;
    });

    const result = await healthCheck.getDataHealth();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('database');
    expect(result.healthy).toBeTruthy();
    expect(result.info).toMatch('Database Service connected successfully.');
    expect(mockConnFn).toHaveBeenCalledTimes(1);
  });

  it('should return an object with a failed connection', async () => {
    mockConnFn.mockImplementation(async () => {
      return false;
    });

    const result = await healthCheck.getDataHealth();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('database');
    expect(result.healthy).toBeFalsy();
    expect(result.info).toMatch('Database Service connection failed.');
    expect(mockConnFn).toHaveBeenCalledTimes(1);
  });
});

describe('getQueueHealth', () => {
  beforeEach(() => {
    mockConnFn.mockClear();
  });

  it('should return an object with a successful connection', async () => {
    mockConnFn.mockImplementation(async () => {
      return true;
    });

    const result = await healthCheck.getQueueHealth();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('queue');
    expect(result.healthy).toBeTruthy();
    expect(result.info).toMatch('Queue Service connected successfully.');
    expect(mockConnFn).toHaveBeenCalledTimes(1);
  });

  it('should return an object with a failed connection', async () => {
    mockConnFn.mockImplementation(async () => {
      return false;
    });

    const result = await healthCheck.getQueueHealth();

    expect(result).toBeTruthy();
    expect(result.name).toMatch('queue');
    expect(result.healthy).toBeFalsy();
    expect(result.info).toMatch('Queue Service connection failed.');
    expect(mockConnFn).toHaveBeenCalledTimes(1);
  });
});

describe('getSmtpHealth', () => {
  beforeEach(() => {
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
    expect(mockConnFn).toHaveBeenCalledTimes(1);
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
    expect(mockConnFn).toHaveBeenCalledTimes(1);
  });
});
