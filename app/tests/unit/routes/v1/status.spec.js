const Problem = require('api-problem');
const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/status');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/status';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc');

const getMessageStatus = msgId => {
  return {
    createdTimestamp: 1571679721833,
    delayTS: 0,
    msgId: msgId,
    status: 'completed',
    tag: 'tag',
    txId: '00000000-0000-0000-0000-000000000000',
    updatedTimestamp: 1571679722674
  };
};

const getMessageStatusHistory = msgId => {
  const status = getMessageStatus(msgId);
  status.statusHistory = [
    {
      description: null,
      status: 'completed',
      timestamp: 1571679722653
    },
    {
      description: null,
      status: 'delivered',
      timestamp: 1571679722622
    },
    {
      description: null,
      status: 'processing',
      timestamp: 1571679722044
    },
    {
      description: null,
      status: 'enqueued',
      timestamp: 1571679721991
    },
    {
      description: null,
      status: 'accepted',
      timestamp: 1571679721833
    }
  ];

  return status;
};

describe(`POST ${basePath}`, () => {
  afterEach(() => {
    ChesService.prototype.findStatuses.mockClear();
  });

  it('should respond with an array of messages', async () => {
    const id = '00000000-0000-0000-0000-000000000000';
    ChesService.prototype.findStatuses.mockResolvedValue([
      getMessageStatus(id)
    ]);

    const response = await request(app).get(`${basePath}`).query({
      fields: 'createdTimestamp,delayTS,updatedTimestamp',
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0].createdTimestamp).toBe(1571679721833);
    expect(response.body[0].delayTS).toBe(0);
    expect(response.body[0].msgId).toMatch(id);
    expect(response.body[0].status).toMatch('completed');
    expect(response.body[0].tag).toBeTruthy();
    expect(response.body[0].txId).toBeTruthy();
    expect(response.body[0].updatedTimestamp).toBe(1571679722674);
  });

  it('should respond with an empty array if nothing was found', async () => {
    ChesService.prototype.findStatuses.mockResolvedValue([]);

    const response = await request(app).get(`${basePath}`).query({
      fields: 'createdTimestamp,delayTS,updatedTimestamp',
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });

  it('should respond with an internal server error', async () => {
    const errorMsg = 'error';
    ChesService.prototype.findStatuses.mockImplementation(() => {
      throw new Error(errorMsg);
    });

    const response = await request(app).get(`${basePath}`).query({
      fields: 'createdTimestamp,delayTS,updatedTimestamp',
      msgId: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      tag: 'tag',
      txId: '00000000-0000-0000-0000-000000000000'
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.title).toMatch('Internal Server Error');
    expect(response.body.details).toMatch(errorMsg);
  });

  it('should respond with a validation error', async () => {
    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });
});

describe(`POST ${basePath}/:msgId`, () => {
  afterEach(() => {
    ChesService.prototype.getStatus.mockClear();
  });

  it('should respond with the state of a message', async () => {
    const id = '00000000-0000-0000-0000-000000000000';
    ChesService.prototype.getStatus.mockResolvedValue(getMessageStatusHistory(id));

    const response = await request(app).get(`${basePath}/${id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.createdTimestamp).toBeGreaterThan(0);
    expect(response.body.delayTS).toBeDefined();
    expect(response.body.msgId).toMatch(id);
    expect(response.body.status).toMatch('completed');
    expect(response.body.statusHistory).toHaveLength(5);
    expect(response.body.tag).toBeTruthy();
    expect(response.body.txId).toBeTruthy();
    expect(response.body.updatedTimestamp).toBeGreaterThan(0);
  });

  it('should respond with a not found error', async () => {
    const id = '00000000-0000-0000-0000-000000000000';
    ChesService.prototype.getStatus.mockImplementation(() => {
      throw new Problem(404);
    });

    const response = await request(app).get(`${basePath}/${id}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.title).toMatch('Not Found');
  });

  it('should respond with a validation error', async () => {
    const id = 'badId';
    const response = await request(app).get(`${basePath}/${id}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });
});
