const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/merge');
const mergeComponent = require('../../../../src/components/merge');

// Simple Express Server
const basePath = '/api/v1/merge';
const app = helper.expressHelper(basePath, router);

const errorMessage = 'broken';
const url = 'https://example.com';
const contexts = [{
  context: {good: 'value'},
  to: ['email@email.org']
}];


jest.mock('../../../../src/services/dataSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      create: async (client, msg) => {
        return {
          'transactionId': '8300b0e9-51dc-4280-a769-cc4fa8c124a0',
          'client': client,
          'createdAt': '2019-10-14T23:08:44.199Z',
          'updatedAt': '2019-10-14T23:08:44.199Z',
          'messages': [
            {
              'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
              'transactionId': '8300b0e9-51dc-4280-a769-cc4fa8c124a0',
              'tag': msg.tag,
              'delayTimestamp': null,
              'status': 'accepted',
              'createdAt': '2019-10-14T23:08:44.199Z',
              'updatedAt': '2019-10-14T23:08:44.199Z',
              'statusHistory': [
                {
                  'statusId': 6,
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'accepted',
                  'description': null,
                  'createdAt': '2019-10-14T23:08:44.199Z'
                }
              ],
              'content': {
                'contentId': 2,
                'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                'email': {
                  'attachments': [],
                  'bcc': [],
                  'bodyType': msg.bodyType,
                  'body': msg.body,
                  'cc': [],
                  'encoding': 'utf-8',
                  'from': msg.from,
                  'priority': msg.priority,
                  'to': msg.to,
                  'subject': msg.subject,
                  'tag': msg.tag
                },
                'createdAt': '2019-10-14T23:08:44.199Z',
                'updatedAt': '2019-10-14T23:08:44.199Z'
              },
              'queueHistory': []
            }
          ]
        };
      },
      readTransaction: async (id) => {
        return {
          'transactionId': id,
          'client': 'MSSC_SERVICE_CLIENT',
          'createdAt': '2019-10-14T23:08:44.199Z',
          'updatedAt': '2019-10-14T23:08:44.199Z',
          'messages': [
            {
              'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
              'transactionId': id,
              'tag': 'a tag value',
              'delayTimestamp': null,
              'status': 'enqueued',
              'createdAt': '2019-10-14T23:08:44.199Z',
              'updatedAt': '2019-10-14T23:09:15.477Z',
              'statusHistory': [
                {
                  'statusId': 6,
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'accepted',
                  'description': null,
                  'createdAt': '2019-10-14T23:08:44.199Z'
                },
                {
                  'statusId': 7,
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'enqueued',
                  'description': null,
                  'createdAt': '2019-10-14T23:09:15.450Z'
                }
              ],
              'content': {
                'contentId': 2,
                'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                'email': {
                  'attachments': [],
                  'bcc': [],
                  'bodyType': 'text',
                  'body': 'body',
                  'cc': [],
                  'encoding': 'utf-8',
                  'from': 'email@email.com',
                  'priority': 'normal',
                  'to': ['email@email.com'],
                  'subject': 'subject',
                  'tag': 'tag'
                },
                'createdAt': '2019-10-14T23:08:44.199Z',
                'updatedAt': '2019-10-14T23:08:44.199Z'
              },
              'queueHistory': [
                {
                  'queueId': 5,
                  'externalQueueId': '863346a3-30ec-478d-bf72-00b4cc1b78c4',
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'enqueued',
                  'description': null,
                  'createdAt': '2019-10-14T23:09:15.450Z'
                }
              ]
            }
          ]
        };
      }
      
    };
  });
});

jest.mock('../../../../src/services/emailSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      send: async (msg, ethereal = false) => {
        if (ethereal) {
          return 'https://example.com';
        } else {
          return {};
        }
      }
    };
  });
});

jest.mock('../../../../src/services/queueSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      // eslint-disable-next-line no-unused-vars
      enqueue: async (message, opts = {}) => {
        return '2bb7b7c3-d7bb-4b46-bcde-527b394270d7';
      }
    };
  });
});

describe(`POST ${basePath}`, () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      subject: 'subject',
      contexts: [{
        to: undefined,
        context: {good: 'bad'}
      }],
    });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should yield a validation error for context field', async () => {
    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      subject: 'subject',
      contexts: [{
        to: ['email@email.com'],
        context: 'undefined'
      }],
    });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should push a message and yield an Ethereal url', async () => {
    const spy = jest.spyOn(mergeComponent, 'mergeMailEthereal').mockResolvedValue([url]);

    const response = await request(app).post(`${basePath}`)
      .query('devMode=true')
      .send({
        bodyType: 'text',
        body: 'body',
        contexts: contexts,
        from: 'email@email.com',
        subject: 'subject'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatch(url);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should push a message and yield a nodemailer response', async () => {
    const spy = jest.spyOn(mergeComponent, 'mergeMailSmtp').mockResolvedValue([{}]);

    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should respond when sending fails', async () => {
    const spy = jest.spyOn(mergeComponent, 'mergeMailSmtp').mockRejectedValue(new Error(errorMessage));

    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe(`POST ${basePath}/preview`, () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post(`${basePath}/preview`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      subject: 'subject',
      contexts: [{
        to: undefined,
        context: {good: 'bad'}
      }],
    });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should yield a validation error for context field', async () => {
    const response = await request(app).post(`${basePath}/preview`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      subject: 'subject',
      contexts: [{
        to: ['email@email.com'],
        context: 'undefined'
      }],
    });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should yield a nodemailer message object', async () => {
    const spy = jest.spyOn(mergeComponent, 'mergeTemplate').mockReturnValue([{}]);

    const response = await request(app).post(`${basePath}/preview`).send({
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should respond when sending fails', async () => {
    const spy = jest.spyOn(mergeComponent, 'mergeTemplate').mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await request(app).post(`${basePath}/preview`).send({
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
