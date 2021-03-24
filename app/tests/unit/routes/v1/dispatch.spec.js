const Problem = require('api-problem');
const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/dispatch');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/cancel';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc');

describe(`POST ${basePath}/:msgId`, () => {
  const spy = ChesService.prototype.dispatchMessage;

  afterEach(() => {
    spy.mockClear();
  });

  it('should respond with an acknowledgement', async () => {
    spy.mockResolvedValue(undefined);
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).post(`${basePath}/${id}`);
    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('dispatch', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, id);
  });

  it('should respond with a not found error', async () => {
    spy.mockImplementation(() => { throw new Problem(404); });
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).post(`${basePath}/${id}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.title).toMatch('Not Found');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, id);
  });

  it('should respond with a conflict error', async () => {
    spy.mockImplementation(() => { throw new Problem(409); });
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).post(`${basePath}/${id}`);

    expect(response.statusCode).toBe(409);
    expect(response.body.title).toMatch('Conflict');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, id);
  });

  it('should respond with a validation error', async () => {
    const id = 'badId';
    const response = await request(app).post(`${basePath}/${id}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
