const Problem = require('api-problem');
const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/cancel');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/cancel';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc');

describe(`DELETE ${basePath}`, () => {
  const spy = ChesService.prototype.findCancelMessages;

  afterEach(() => {
    ChesService.prototype.findCancelMessages.mockClear();
  });

  it('should respond with an acknowledgement when a message is found', async () => {
    spy.mockResolvedValue(undefined);
    const query = {
      msgId: '00000000-0000-0000-0000-000000000000'
    };

    const response = await request(app).delete(`${basePath}`).query(query);
    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('cancel', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, undefined, undefined, undefined);
  });

  it('should respond with an acknowledgement when multiple messages are found', async () => {
    spy.mockResolvedValue(undefined);
    const query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'pending',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };

    const response = await request(app).delete(`${basePath}`).query(query);
    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('cancel', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, query.status, query.tag, query.txId);
  });

  it('should respond with an acknowledgement when nothing is found', async () => {
    spy.mockResolvedValue(undefined);
    const query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'accepted',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };

    const response = await request(app).delete(`${basePath}`).query(query);

    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('cancel', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, query.status, query.tag, query.txId);
  });

  it('should respond with an internal server error', async () => {
    const errorMsg = 'error';
    const query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'pending',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };
    spy.mockImplementation(() => {
      throw new Error(errorMsg);
    });

    const response = await request(app).delete(`${basePath}`).query(query);

    expect(response.statusCode).toBe(500);
    expect(response.body.title).toMatch('Internal Server Error');
    expect(response.body.details).toMatch(errorMsg);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, query.status, query.tag, query.txId);
  });

  it.skip('should respond with a validation error', async () => {
    const response = await request(app).delete(`${basePath}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].value).toMatch('params');
    expect(response.body.errors[0].message).toMatch('At least one of `msgId`, `status`, `tag` or `txId` must be defined.');
  });
});

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
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('cancel', 'status'));
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

  it('should respond with a conflict error', async () => {
    spy.mockImplementation(() => { throw new Problem(409); });
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).delete(`${basePath}/${id}`);

    expect(response.statusCode).toBe(409);
    expect(response.body.title).toMatch('Conflict');
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
