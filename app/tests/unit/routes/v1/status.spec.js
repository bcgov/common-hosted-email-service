const Problem = require('api-problem');
const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/status');

// Simple Express Server
const basePath = '/api/v1/status';
const app = helper.expressHelper(basePath, router);

const mockNotFound = jest.fn(() => {
  throw new Problem(404);
});

jest.mock('../../../../src/services/chesSvc', () => {
  return jest.fn(() => {
    return {
      getStatus: async (client, msgId) => {
        if (msgId === '00000000-0000-0000-0000-000000000000') {
          mockNotFound();
        }
        return {
          createdTimestamp: 1571679721833,
          delayTS: 0,
          msgId: msgId,
          status: 'completed',
          statusHistory: [
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
          ],
          tag: 'tag',
          txId: '00000000-0000-0000-0000-000000000000',
          updatedTimestamp: 1571679722674
        };
      }
    };
  });
});

describe(`POST ${basePath}/:msgId`, () => {

  it('should respond with the state of a message', async () => {
    const id = '11111111-1111-1111-0111-111111111111';
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
    const response = await request(app).get(`${basePath}/${id}`);
    expect(response.statusCode).toBe(404);
  });

  it('should respond with a validation error', async () => {
    const id = 'badId';
    const response = await request(app).get(`${basePath}/${id}`);
    expect(response.statusCode).toBe(422);
  });

});
