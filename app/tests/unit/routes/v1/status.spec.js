const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/status');
const statusComponent = require('../../../../src/components/status');

jest.mock('bull');

// Simple Express Server
const basePath = '/api/v1/status';
const app = helper.expressHelper(basePath, router);

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
