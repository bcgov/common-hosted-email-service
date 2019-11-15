const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/merge');
const mergeComponent = require('../../../../src/components/merge');

const ChesService = require('../../../../src/services/chesSvc');

// Simple Express Server
const basePath = '/api/v1/merge';
const app = helper.expressHelper(basePath, router);

const errorMessage = 'broken';
const contexts = [
  {
    context: { good: 'value' },
    to: ['email@email.org']
  }];

jest.mock('../../../../src/services/chesSvc');

describe(`POST ${basePath}`, () => {
  const spy = ChesService.prototype.sendEmailMerge;
  let body;

  beforeEach(() => {
    body = {
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    };
  });

  afterEach(() => {
    spy.mockClear();
  });

  it('should yield a validation error for to field', async () => {
    body.contexts = [{ to: undefined, context: { good: 'bad' }}];
    const response = await request(app).post(`${basePath}`).send(body);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should yield a validation error for context field', async () => {
    body.contexts = [{ to: ['email@email.com'], context: 'undefined' }];
    const response = await request(app).post(`${basePath}`).send(body);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should push a message and yield an Ethereal url', async () => {
    spy.mockResolvedValue('https://example.com');

    const response = await request(app).post(`${basePath}`)
      .query('devMode=true').send(body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toMatch('https://example.com');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined, body, true);
  });

  it('should push a message and yield a transasction response', async () => {
    spy.mockResolvedValue({
      txId: 'asdfasdfadsf',
      messages: [{ msgId: 'qwerqwerqwerw', to: ['email@email.org'] }]
    });

    const response = await request(app).post(`${basePath}`).send(body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body.txId).toBeTruthy();
    expect(response.body.messages).toBeTruthy();
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].to).toHaveLength(1);
    expect(response.body.messages[0].to[0]).toMatch('email@email.org');
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

describe(`POST ${basePath}/preview`, () => {
  const spy = jest.spyOn(mergeComponent, 'mergeTemplate');
  let body;

  beforeEach(() => {
    body = {
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    };
  });

  afterEach(() => {
    spy.mockClear();
  });

  it('should yield a validation error for to field', async () => {
    body.contexts = [{ to: undefined, context: { good: 'bad' }}];
    const response = await request(app).post(`${basePath}/preview`).send(body);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should yield a validation error for context field', async () => {
    body.contexts = [{ to: ['email@email.com'], context: 'undefined' }];
    const response = await request(app).post(`${basePath}/preview`).send(body);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should yield a nodemailer message object', async () => {
    const response = await request(app).post(`${basePath}/preview`).send(body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(body);
  });

  it('should respond when sending fails', async () => {
    spy.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await request(app).post(`${basePath}/preview`).send(body);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(body);
  });
});
