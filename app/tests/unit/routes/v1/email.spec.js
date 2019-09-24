const express = require('express');
const request = require('supertest');

const router = require('../../../../src/routes/v1/email');
const emailComponent = require('../../../../src/components/email');

// Simple Express Server
const basePath = '/api/v1/email';
const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(basePath, router);

const errorMessage = 'broken';
const url = 'https://example.com';
const contexts = [{
  context: {good: 'value'},
  to: ['email@email.org']
}];

describe(`POST ${basePath}`, () => {
  it('should yield a validation error', async () => {
    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(422);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });

  it('should push a message and yield an Ethereal url', async () => {
    const spy = jest.spyOn(emailComponent, 'sendMailEthereal').mockResolvedValue(url);

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
    expect(response.body).toMatch(url);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should push a message and yield a nodemailer response', async () => {
    const spy = jest.spyOn(emailComponent, 'sendMailSmtp').mockResolvedValue({});

    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      to: ['email@email.com'],
      subject: 'subject'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should respond when sending fails', async () => {
    const spy = jest.spyOn(emailComponent, 'sendMailSmtp').mockRejectedValue(new Error(errorMessage));

    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      from: 'email@email.com',
      to: ['email@email.com'],
      subject: 'subject'
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe(`POST ${basePath}/merge`, () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post(`${basePath}/merge`).send({
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
    const response = await request(app).post(`${basePath}/merge`).send({
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
    const spy = jest.spyOn(emailComponent, 'mergeMailEthereal').mockResolvedValue([url]);

    const response = await request(app).post(`${basePath}/merge`)
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
    const spy = jest.spyOn(emailComponent, 'mergeMailSmtp').mockResolvedValue([{}]);

    const response = await request(app).post(`${basePath}/merge`).send({
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
    const spy = jest.spyOn(emailComponent, 'mergeMailSmtp').mockRejectedValue(new Error(errorMessage));

    const response = await request(app).post(`${basePath}/merge`).send({
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

describe(`POST ${basePath}merge/preview`, () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post(`${basePath}/merge/preview`).send({
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
    const response = await request(app).post(`${basePath}/merge/preview`).send({
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
    const spy = jest.spyOn(emailComponent, 'mergeTemplate').mockReturnValue([{}]);

    const response = await request(app).post(`${basePath}/merge/preview`).send({
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
    const spy = jest.spyOn(emailComponent, 'mergeTemplate').mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await request(app).post(`${basePath}/merge/preview`).send({
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
