const request = require('supertest');

const helper = require('../../../common/helper');
const router = require('../../../../src/routes/v1/email');
const emailComponent = require('../../../../src/components/email');
const queueComponent = require('../../../../src/components/queue');

jest.mock('bull');

// Simple Express Server
const basePath = '/api/v1/email';
const app = helper.expressHelper(basePath, router);

const errorMessage = 'broken';
const url = 'https://example.com';

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

  it('should queue a message and yield an uuid correspondence', async () => {
    const id = 'id';
    const spy = jest.spyOn(queueComponent, 'enqueue').mockImplementation(() => {
      return id;
    });

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
    expect(response.body.msgId).toMatch(id);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should respond when sending fails', async () => {
    const spy = jest.spyOn(queueComponent, 'enqueue').mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await request(app).post(`${basePath}`).send({
      bodyType: 'text',
      body: 'body',
      delayTS: 0,
      from: 'email@email.com',
      to: ['email@email.com'],
      subject: 'subject',
      tag: 'tag'
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
