const request = require('supertest');
const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/status');

// Simple Express Server
const basePath = '/api/v1/status';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getStatus: async (msgId, includeHistory) => {
        if (msgId === 'notfound') {
          throw new Error();
        }
        const result = {
          'msgId': msgId,
          'delayTS': null,
          'status': 'completed',
          'updatedAt': 1571103671925,
          'statuses': [
            {
              'status': 'completed',
              'description': null,
              'createdAt': 1571103671920
            },
            {
              'status': 'delivered',
              'description': null,
              'createdAt': 1571103671898
            },
            {
              'status': 'processing',
              'description': null,
              'createdAt': 1571103671680
            },
            {
              'status': 'enqueued',
              'description': null,
              'createdAt': 1571103671672
            },
            {
              'status': 'accepted',
              'description': null,
              'createdAt': 1571103671565
            }
          ]
        };
        if (!includeHistory) {
          delete result.statuses;
        }
        return result;
      }
    };
  });
});

describe(`POST ${basePath}/:msgId`, () => {
  
  it('should respond with the state of a message', async () => {
    const id = 'abcdefghi';
    const response = await request(app).get(`${basePath}/${id}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.msgId).toMatch(id);
    expect(response.body.status).toMatch('completed');
    expect(response.body.statuses).toBeFalsy();
    
  });
  
  it('should respond with the state of a message and status history', async () => {
    const id = 'abcdefghi';
    const response = await request(app).get(`${basePath}/${id}?history=1`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.msgId).toMatch(id);
    expect(response.body.status).toMatch('completed');
    expect(response.body.statuses).toHaveLength(5);
    
  });
  
  it('should respond with a not found error', async () => {
    const id = 'notfound';
    const response = await request(app).get(`${basePath}/${id}`);
    expect(response.statusCode).not.toBe(200);
  });
});
