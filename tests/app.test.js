const request = require('supertest');
const { app } = require('../src/app');

describe('Tests fonctionnels API', () => {
  test('GET /health retourne 200', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('POST /echo retourne le message', async () => {
    const response = await request(app)
      .post('/echo')
      .send({ message: 'bonjour' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('bonjour');
  });
});
