const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/merge');
const mergeComponent = require('../../../../src/components/merge');

// Simple Express Server
const basePath = '/api/v1/merge';
const app = helper.expressHelper(basePath, router);

const errorMessage = 'broken';
const contexts = [
  {
    context: { good: 'value' },
    to: ['email@email.org']
  }];

jest.mock('../../../../src/services/chesSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      sendEmailMerge: async (client, message, ethereal) => {
        if (ethereal) {
          return 'https://example.com';
        } else {
          return {
            txId: 'asdfasdfadsf',
            messages: [{ msgId: 'qwerqwerqwerw', to: ['email@email.org'] }]
          };
        }
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
      contexts: [
        {
          to: undefined,
          context: { good: 'bad' }
        }]
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
      contexts: [
        {
          to: ['email@email.com'],
          context: 'undefined'
        }]
    });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should push a message and yield an Ethereal url', async () => {

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
    expect(response.body).toMatch('https://example.com');
  });

  it('should push a message and yield a transasction response', async () => {

    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      contexts: contexts,
      from: 'email@email.com',
      subject: 'subject'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body.txId).toBeTruthy();
    expect(response.body.messages).toBeTruthy();
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].to).toHaveLength(1);
    expect(response.body.messages[0].to[0]).toMatch('email@email.org');

  });
});

describe(`POST ${basePath}/preview`, () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post(`${basePath}/preview`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      subject: 'subject',
      contexts: [
        {
          to: undefined,
          context: { good: 'bad' }
        }]
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
      contexts: [
        {
          to: ['email@email.com'],
          context: 'undefined'
        }]
    });

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(1);
  });

  it('should yield a nodemailer message object', async () => {

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
