const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/email');

// Simple Express Server
const basePath = '/api/v1/email';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      sendEmail: async (client, message, ethereal) => {
        if (ethereal) {
          return 'https://example.com';
        } else {
          return {
            txId: 'asdfasdfadsf',
            messages: [{ msgId: 'qwerqwerqwerw', to: message.to }]
          };
        }
      }
    };
  });
});

describe(`POST ${basePath}`, () => {
  it('should yield a validation error', async () => {
    const response = await request(app).post(`${basePath}`);
    
    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });
  
  it('should push a message and yield an Ethereal url', async () => {
    const response = await request(app).post(`${basePath}`)
      .query('devMode=true')
      .send({
        bodyType: 'text',
        body: 'body',
        from: 'email@email.com',
        to: ['email@email.com'],
        subject: 'subject'
      });
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toMatch('https://example.com');
  });
  
  it('should queue a message and yield an transaction response', async () => {
    
    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      delayTS: 1,
      from: 'email@email.com',
      to: ['email@email.com'],
      subject: 'subject',
      tag: 'tag'
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body.txId).toBeTruthy();
    expect(response.body.messages).toBeTruthy();
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].to).toHaveLength(1);
    expect(response.body.messages[0].to[0]).toMatch('email@email.com');
    
  });
  
});
