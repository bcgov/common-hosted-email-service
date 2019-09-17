const express = require('express');
const request = require('supertest');

const router = require('../../../src/routes/v1');

// Simple Express Server
const basePath = '/api/v1';
const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(basePath, router);

describe('GET /api/v1', () => {
  it('should return all available endpoints', async () => {
    const response = await request(app).get('/api/v1');

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body).toEqual({
      endpoints: [
        '/checks',
        '/email'
      ]
    });
  });
});

describe('GET /api/v1/docs', () => {
  it('should return a redoc html page', async () => {
    const response = await request(app).get('/api/v1/docs');

    expect(response.statusCode).toBe(200);
    expect(response.text).toMatch(/<title>Common Hosted Email Service API - Documentation/);
  });
});

describe('GET /api/v1/api-spec.yaml', () => {
  it('should return the OpenAPI yaml spec', async () => {
    const response = await request(app).get('/api/v1/api-spec.yaml');

    expect(response.statusCode).toBe(200);
    expect(response.text).toMatch(/openapi: 3.0.0/);
    expect(response.text).toMatch(/title: Common Hosted Email Service API/);
  });
});
