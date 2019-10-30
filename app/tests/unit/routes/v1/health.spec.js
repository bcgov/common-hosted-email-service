const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/health');
const healthCheck = require('../../../../src/components/health');

// Simple Express Server
const basePath = '/api/v1/health';
const app = helper.expressHelper(basePath, router);

describe(`GET ${basePath}`, () => {
  afterEach(() => {
    healthCheck.getSmtpHealth.mockReset();
  });

  it('should return the status of correspondent apis', async () => {
    healthCheck.getSmtpHealth = jest.fn().mockResolvedValue({name: 'smtp', healthy: true, info: 'good'});

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.dependencies).toBeTruthy();
    expect(response.body.dependencies).toHaveLength(1);
    expect(response.body.dependencies[0].name).toMatch('smtp');
    expect(response.body.dependencies[0].healthy).toBeTruthy();
    expect(response.body.dependencies[0].info).toBeTruthy();
    expect(response.body.dependencies[0].info).toMatch('good');
  });

  it('should respond even with an exception', async () => {
    healthCheck.getSmtpHealth = jest.fn().mockResolvedValue({name: 'smtp', healthy: false, info: 'bad'});

    const response = await request(app).get(`${basePath}`);

    expect(response.body.dependencies).toBeTruthy();
    expect(response.body.dependencies).toHaveLength(1);
    expect(response.body.dependencies[0].name).toMatch('smtp');
    expect(response.body.dependencies[0].healthy).toBeFalsy();
    expect(response.body.dependencies[0].info).toBeTruthy();
    expect(response.body.dependencies[0].info).toMatch('bad');
  });

  it('should fail gracefully when an error occurs', async () => {
    healthCheck.getSmtpHealth = jest.fn().mockImplementation(() => {throw new Error('bad');});

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.details).toBe('bad');
  });

});
