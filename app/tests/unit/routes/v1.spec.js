const request = require('supertest');

const helper = require('../../common/helper');
const router = require('../../../src/routes/v1');

jest.mock('bull');

// Simple Express Server
const basePath = '/api/v1';
const app = helper.expressHelper(basePath, router);

describe('GET /api/v1', () => {
  it('should return all available endpoints', async () => {
    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(Array.isArray(response.body.endpoints)).toBeTruthy();
    expect(response.body.endpoints).toHaveLength(9);
    expect(response.body.endpoints).toContain('/api-spec.json');
    expect(response.body.endpoints).toContain('/api-spec.yaml');
    expect(response.body.endpoints).toContain('/docs');
    expect(response.body.endpoints).toContain('/email');
    expect(response.body.endpoints).toContain('/emailMerge');
    expect(response.body.endpoints).toContain('/health');
    expect(response.body.endpoints).toContain('/status');
    expect(response.body.endpoints).toContain('/cancel');
    expect(response.body.endpoints).toContain('/promote');
  });
});
