const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/health');
const healthCheck = require('../../../../src/components/health');

// Simple Express Server
const basePath = '/api/v1/health';
const app = helper.expressHelper(basePath, router);

describe(`GET ${basePath}`, () => {
  afterEach(() => {
    healthCheck.getDataHealth.mockReset();
    healthCheck.getQueueHealth.mockReset();
    healthCheck.getSmtpHealth.mockReset();
  });

  it('should return the status of correspondent apis', async () => {
    healthCheck.getDataHealth = jest.fn().mockResolvedValue({
      name: 'database', healthy: true, info: 'good'
    });
    healthCheck.getQueueHealth = jest.fn().mockResolvedValue({
      name: 'queue', healthy: true, info: 'good'
    });
    healthCheck.getSmtpHealth = jest.fn().mockResolvedValue({
      name: 'smtp', healthy: true, info: 'good'
    });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.dependencies).toBeTruthy();
    expect(response.body.dependencies).toHaveLength(3);
    expect(response.body.dependencies[0].name).toMatch('database');
    expect(response.body.dependencies[0].healthy).toBeTruthy();
    expect(response.body.dependencies[0].info).toMatch('good');
    expect(response.body.dependencies[1].name).toMatch('queue');
    expect(response.body.dependencies[1].healthy).toBeTruthy();
    expect(response.body.dependencies[1].info).toMatch('good');
    expect(response.body.dependencies[2].name).toMatch('smtp');
    expect(response.body.dependencies[2].healthy).toBeTruthy();
    expect(response.body.dependencies[2].info).toMatch('good');
  });

  it('should respond even with an exception', async () => {
    healthCheck.getDataHealth = jest.fn().mockResolvedValue({
      name: 'database', healthy: false, info: 'bad'
    });
    healthCheck.getQueueHealth = jest.fn().mockResolvedValue({
      name: 'queue', healthy: false, info: 'bad'
    });
    healthCheck.getSmtpHealth = jest.fn().mockResolvedValue({
      name: 'smtp', healthy: false, info: 'bad'
    });

    const response = await request(app).get(`${basePath}`);

    expect(response.body.dependencies).toBeTruthy();
    expect(response.body.dependencies).toHaveLength(3);
    expect(response.body.dependencies[0].name).toMatch('database');
    expect(response.body.dependencies[0].healthy).toBeFalsy();
    expect(response.body.dependencies[0].info).toMatch('bad');
    expect(response.body.dependencies[1].name).toMatch('queue');
    expect(response.body.dependencies[1].healthy).toBeFalsy();
    expect(response.body.dependencies[1].info).toMatch('bad');
    expect(response.body.dependencies[2].name).toMatch('smtp');
    expect(response.body.dependencies[2].healthy).toBeFalsy();
    expect(response.body.dependencies[2].info).toMatch('bad');
  });

  it('should fail gracefully when an error occurs', async () => {
    healthCheck.getAll = jest.fn().mockImplementation(() => { throw new Error('bad'); });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.details).toBe('bad');

    healthCheck.getAll.mockReset();
  });

});
