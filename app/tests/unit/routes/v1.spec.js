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
    expect(response.body).toEqual({
      endpoints: [
        '/api-spec.yaml',
        '/docs',
        '/email',
        '/emailMerge',
        '/health',
        '/status'
      ]
    });
  });
});

describe('GET /api/v1/docs', () => {
  it('should return a redoc html page', async () => {
    const response = await request(app).get(`${basePath}/docs`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toMatch(/<title>Common Hosted Email Service API - Documentation/);
  });
});

describe('GET /api/v1/api-spec.yaml', () => {
  it('should return the OpenAPI yaml spec', async () => {
    const response = await request(app).get(`${basePath}/api-spec.yaml`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toMatch(/openapi: 3.0.2/);
    expect(response.text).toMatch(/title: Common Hosted Email Service API/);
  });
});
