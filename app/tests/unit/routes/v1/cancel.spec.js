const Problem = require('api-problem');
const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/cancel');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/cancel';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc');

describe(`DELETE ${basePath}/:msgId`, () => {
  const spy = ChesService.prototype.cancelMessage;

  afterEach(() => {
    spy.mockClear();
  });

  it('should respond with an acknowledgement', async () => {
    spy.mockResolvedValue(undefined);
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).delete(`${basePath}/${id}`);

    expect(response.statusCode).toBe(202);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, id);
  });

  it('should respond with a not found error', async () => {
    spy.mockImplementation(() => { throw new Problem(404); });
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).delete(`${basePath}/${id}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.title).toMatch('Not Found');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, id);
  });

  it('should respond with a validation error', async () => {
    const id = 'badId';
    const response = await request(app).delete(`${basePath}/${id}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0);
  });
});
