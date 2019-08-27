const request = require('supertest');

const app = require('../../../../app');
const checkComponent = require('../../../../src/components/checks');

describe('GET /api/v1/checks/status', () => {
  afterEach(() => {
    checkComponent.getStatus.mockReset();
  });

  it('should return the status of correspondent apis', async () => {
    checkComponent.getStatus = jest.fn().mockResolvedValue([{}]);

    const response = await request(app).get('/api/v1/checks/status');

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(response.body.endpoints).toHaveLength(1);
  });

  it('should return an error gracefully', async () => {
    checkComponent.getStatus = jest.fn().mockResolvedValue({});

    const response = await request(app).get('/api/v1/checks/status');

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
    expect(response.body.detail).toMatch('Unable to get API status list');
  });
});
