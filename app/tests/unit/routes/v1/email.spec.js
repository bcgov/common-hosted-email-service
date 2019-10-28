const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/email');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/email';
const app = helper.expressHelper(basePath, router);

jest.mock('../../../../src/services/chesSvc');

describe(`POST ${basePath}`, () => {
  const spy = ChesService.prototype.sendEmail;
  let body;

  beforeEach(() => {
    body = {
      bodyType: 'text',
      body: 'body',
      delayTS: 1,
      from: 'email@email.com',
      to: ['email@email.com'],
      subject: 'subject',
      tag: 'tag'
    };
  });

  afterEach(() => {
    spy.mockClear();
  });

  it('should yield a validation error', async () => {
    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should push a message and yield an Ethereal url', async () => {
    delete body.delayTS;
    delete body.tag;
    spy.mockImplementation(() => {
      return 'https://example.com';
    });

    const response = await request(app).post(`${basePath}`)
      .query('devMode=true').send(body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toMatch('https://example.com');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, body, true);
  });

  it('should queue a message and yield an transaction response', async () => {
    spy.mockImplementation(async (client, message) => {
      return {
        txId: 'asdfasdfadsf',
        messages: [{ msgId: 'qwerqwerqwerw', to: message.to }]
      };
    });

    const response = await request(app).post(`${basePath}`).send(body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body.txId).toBeTruthy();
    expect(response.body.messages).toBeTruthy();
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].to).toHaveLength(1);
    expect(response.body.messages[0].to[0]).toMatch('email@email.com');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, body, false);
  });

  it('should fail gracefully when an error occurs', async () => {
    const errorMsg = 'error';
    spy.mockImplementation(() => {
      throw new Error(errorMsg);
    });

    const response = await request(app).post(`${basePath}`).send(body);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.details).toBe(errorMsg);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, body, false);
  });
});
