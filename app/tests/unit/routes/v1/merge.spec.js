const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/merge');
const mergeComponent = require('../../../../src/components/merge');

jest.mock('bull');

// Simple Express Server
const basePath = '/api/v1/merge';
const app = helper.expressHelper(basePath, router);

const errorMessage = 'broken';
const url = 'https://example.com';
const contexts = [{
  context: {good: 'value'},
  to: ['email@email.org']
}];

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
