const Problem = require('api-problem');
const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/promote');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/promote';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc');

describe(`POST ${basePath}`, () => {
  const spy = ChesService.prototype.findPromoteMessages;
  let query;

  beforeEach(() => {
    query = {
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'pending',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    };
  });

  afterEach(() => {
    spy.mockClear();
  });

  it('should respond with an acknowledgement when a message is found', async () => {
    spy.mockResolvedValue(undefined);
    delete query.status;
    delete query.tag;
    delete query.txId;

    const response = await request(app).post(`${basePath}`).query(query);
    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('promote', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, undefined, undefined, undefined);
  });

  it('should respond with an acknowledgement when multiple messages are found', async () => {
    spy.mockResolvedValue(undefined);

    const response = await request(app).post(`${basePath}`).query(query);
    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('promote', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, query.status, query.tag, query.txId);
  });

  it('should respond with an acknowledgement when nothing is found', async () => {
    spy.mockResolvedValue(undefined);
    query.status = 'accepted';

    const response = await request(app).post(`${basePath}`).query(query);

    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('promote', 'status'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, query.status, query.tag, query.txId);
  });

  it('should respond with an internal server error', async () => {
    const errorMsg = 'error';
    spy.mockImplementation(() => {
      throw new Error(errorMsg);
    });

    const response = await request(app).post(`${basePath}`).query(query);

    expect(response.statusCode).toBe(500);
    expect(response.body.title).toMatch('Internal Server Error');
    expect(response.body.details).toMatch(errorMsg);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, query.msgId, query.status, query.tag, query.txId);
  });

  it('should respond with a validation error', async () => {
    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].value).toMatch('params');
    expect(response.body.errors[0].message).toMatch('At least one of `msgId`, `status`, `tag` or `txId` must be defined.');
  });
});

describe(`POST ${basePath}/:msgId`, () => {
  const spy = ChesService.prototype.promoteMessage;

  afterEach(() => {
    spy.mockClear();
  });

  it('should respond with an acknowledgement', async () => {
    spy.mockResolvedValue(undefined);
    const id = '00000000-0000-0000-0000-000000000000';

    const response = await request(app).post(`${basePath}/${id}`);
    expect(response.statusCode).toBe(202);
    expect(response.header).toHaveProperty('content-location');
    expect(response.header['content-location']).toMatch(response.req.path.replace('promote', 'status'));
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
