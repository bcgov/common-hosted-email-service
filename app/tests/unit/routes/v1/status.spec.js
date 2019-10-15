const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/status');

// Simple Express Server
const basePath = '/api/v1/status';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/dataSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      readMessage: async (id) => {
        if (id === 'notfound') {
          throw Error();
        }
        return {
          'messageId': id,
          'transactionId': '6997f39a-444e-45ba-88c7-6dd09cdd376f',
          'tag': 'a tag value',
          'delayTimestamp': null,
          'status': 'completed',
          'createdAt': '2019-10-14T23:00:56.726Z',
          'updatedAt': '2019-10-14T23:00:57.744Z',
          'statusHistory': [
            {
              'statusId': 5,
              'messageId': id,
              'status': 'completed',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.740Z'
            },
            {
              'statusId': 4,
              'messageId': id,
              'status': 'delivered',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.714Z'
            },
            {
              'statusId': 3,
              'messageId': id,
              'status': 'processing',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.116Z'
            },
            {
              'statusId': 2,
              'messageId': id,
              'status': 'enqueued',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.105Z'
            },
            {
              'statusId': 1,
              'messageId': id,
              'status': 'accepted',
              'description': null,
              'createdAt': '2019-10-14T23:00:56.726Z'
            }
          ],
          'content': {
            'contentId': 1,
            'messageId': '2bb7b7c3-d7bb-4b46-bcde-527b394270d7',
            'email': null,
            'createdAt': '2019-10-14T23:00:56.726Z',
            'updatedAt': '2019-10-14T23:00:57.764Z'
          },
          'queueHistory': [
            {
              'queueId': 4,
              'externalQueueId': 'e5ab0e5e-3d4c-4473-b686-8c4919090535',
              'messageId': '2bb7b7c3-d7bb-4b46-bcde-527b394270d7',
              'status': 'completed',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.740Z'
            },
            {
              'queueId': 3,
              'externalQueueId': 'e5ab0e5e-3d4c-4473-b686-8c4919090535',
              'messageId': '2bb7b7c3-d7bb-4b46-bcde-527b394270d7',
              'status': 'delivered',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.714Z'
            },
            {
              'queueId': 2,
              'externalQueueId': 'e5ab0e5e-3d4c-4473-b686-8c4919090535',
              'messageId': '2bb7b7c3-d7bb-4b46-bcde-527b394270d7',
              'status': 'processing',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.116Z'
            },
            {
              'queueId': 1,
              'externalQueueId': 'e5ab0e5e-3d4c-4473-b686-8c4919090535',
              'messageId': '2bb7b7c3-d7bb-4b46-bcde-527b394270d7',
              'status': 'enqueued',
              'description': null,
              'createdAt': '2019-10-14T23:00:57.105Z'
            }
          ]
        };
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
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeTruthy();
  });
});
