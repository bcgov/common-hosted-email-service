const express = require('express');
const request = require('supertest');
const Problem = require('api-problem');

const router = require('../../../../src/routes/v1/status');
const statusComponent = require('../../../../src/components/status');

jest.mock('bull');

// Simple Express Server
const basePath = '/api/v1/status';
const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(basePath, router);

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof Problem) {
    err.send(res);
  } else {
    new Problem(500, {
      details: (err.message) ? err.message : err
    }).send(res);
  }
});

const id = 'id';

describe(`POST ${basePath}/:msgId`, () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(statusComponent, 'getMessageId');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should respond with the state of a message', async () => {
    spy.mockResolvedValue('something');

    const response = await request(app).get(`${basePath}/${id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('should respond with a not found error', async () => {
    spy.mockResolvedValue(undefined);

    const response = await request(app).get(`${basePath}/${id}`);

    expect(response.statusCode).toBe(404);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });
});
