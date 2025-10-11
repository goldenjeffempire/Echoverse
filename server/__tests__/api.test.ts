
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

let app: express.Application;
let server: any;

beforeAll(async () => {
  app = express();
  server = await registerRoutes(app);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('API Health Checks', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });
});

describe('GDPR Endpoints', () => {
  let token: string;

  beforeAll(async () => {
    // Register and login a test user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'gdprtest',
        email: 'gdpr@example.com',
        password: 'SecurePass123!',
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'gdpr@example.com',
        password: 'SecurePass123!',
      });

    token = loginResponse.body.token;
  });

  it('should export user data', async () => {
    const response = await request(app)
      .get('/api/gdpr/export')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('exportDate');
  });
});

describe('Metrics Endpoint', () => {
  it('should return Prometheus metrics', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).toBe(200);
    expect(response.text).toContain('# HELP');
  });
});
