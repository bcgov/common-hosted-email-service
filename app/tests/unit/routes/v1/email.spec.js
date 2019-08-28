const request = require('supertest');

const app = require('../../../../app');
const emailComponent = require('../../../../src/components/email');

const errorMessage = 'broken';
const url = 'https://example.com';
const contexts = [{
  context: {},
  to: []
}];

describe('POST /api/v1/email', () => {
  it('should yield a validation error', async () => {
    const response = await request(app).post('/api/v1/email');

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });

  it('should push a message and yield an Ethereal url', async () => {
    const spy = jest.spyOn(emailComponent, 'sendMailEthereal').mockResolvedValue(url);

    const response = await request(app).post('/api/v1/email')
      .query('devMode=true')
      .send({
        bodyType: 'text',
        body: '',
        from: '',
        to: [],
        subject: ''
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toMatch(url);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should push a message and yield a nodemailer response', async () => {
    const spy = jest.spyOn(emailComponent, 'sendMailSmtp').mockResolvedValue({});

    const response = await request(app).post('/api/v1/email').send({
      bodyType: 'text',
      body: '',
      from: '',
      to: [],
      subject: ''
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should yield an error when sending fails', async () => {
    const spy = jest.spyOn(emailComponent, 'sendMailSmtp').mockRejectedValue(new Error(errorMessage));

    const response = await request(app).post('/api/v1/email').send({
      bodyType: 'text',
      body: '',
      from: '',
      to: [],
      subject: ''
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch(errorMessage);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe('POST /api/v1/email/merge', () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post('/api/v1/email/merge').send({
      contexts: [{
        to: undefined
      }],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });

  it('should yield a validation error for context field', async () => {
    const response = await request(app).post('/api/v1/email/merge').send({
      contexts: [{
        to: [],
        context: 'undefined'
      }],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });

  it('should push a message and yield an Ethereal url', async () => {
    const spy = jest.spyOn(emailComponent, 'mergeMailEthereal').mockResolvedValue([url]);

    const response = await request(app).post('/api/v1/email/merge')
      .query('devMode=true')
      .send({
        bodyType: 'text',
        body: '',
        contexts: contexts,
        from: '',
        subject: ''
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

    const response = await request(app).post('/api/v1/email/merge').send({
      bodyType: 'text',
      body: '',
      contexts: contexts,
      from: '',
      subject: ''
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should yield an error when sending fails', async () => {
    const spy = jest.spyOn(emailComponent, 'mergeMailSmtp').mockRejectedValue(new Error(errorMessage));

    const response = await request(app).post('/api/v1/email/merge').send({
      bodyType: 'text',
      body: '',
      contexts: contexts,
      from: '',
      subject: ''
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch(errorMessage);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe('POST /api/v1/email/merge/preview', () => {
  it('should yield a validation error for to field', async () => {
    const response = await request(app).post('/api/v1/email/merge/preview').send({
      contexts: [{
        to: undefined
      }],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });

  it('should yield a validation error for context field', async () => {
    const response = await request(app).post('/api/v1/email/merge/preview').send({
      contexts: [{
        to: [],
        context: 'undefined'
      }],
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Validation failed');
    expect(response.body.errors).toHaveLength(5);
  });

  it('should yield a nodemailer message object', async () => {
    const spy = jest.spyOn(emailComponent, 'mergeTemplate').mockReturnValue([{}]);

    const response = await request(app).post('/api/v1/email/merge/preview').send({
      bodyType: 'text',
      body: '',
      contexts: contexts,
      from: '',
      subject: ''
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toBeTruthy();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should yield an error when sending fails', async () => {
    const spy = jest.spyOn(emailComponent, 'mergeTemplate').mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await request(app).post('/api/v1/email/merge/preview').send({
      bodyType: 'text',
      body: '',
      contexts: contexts,
      from: '',
      subject: ''
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch(errorMessage);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
