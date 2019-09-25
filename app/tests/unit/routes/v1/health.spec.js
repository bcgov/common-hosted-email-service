const express = require('express');
const request = require('supertest');

const router = require('../../../../src/routes/v1/health');
const checkComponent = require('../../../../src/components/health');

// Simple Express Server
const basePath = '/api/v1/health';
const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(basePath, router);

describe(`GET ${basePath}`, () => {
  afterEach(() => {
    checkComponent.getStatus.mockReset();
  });

  it('should return the status of correspondent apis', async () => {
    checkComponent.getStatus = jest.fn().mockResolvedValue([{}]);

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.endpoints).toHaveLength(1);
  });

  it('should respond even with an exception', async () => {
    checkComponent.getStatus = jest.fn().mockResolvedValue({});

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});
