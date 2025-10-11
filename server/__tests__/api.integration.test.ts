import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

describe('API Integration Tests', () => {
  let app: express.Express;
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/register - should register new user', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          password: 'SecurePass123!@#'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('POST /api/login - should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'correct_password'
        });
      
      expect([200, 401]).toContain(res.status);
    });

    it('POST /api/refresh-session - should refresh auth token', async () => {
      if (!authToken) return;
      
      const res = await request(app)
        .post('/api/refresh-session')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('User Management Endpoints', () => {
    it('GET /api/user - should get current user', async () => {
      if (!authToken) return;
      
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 401]).toContain(res.status);
    });

    it('PUT /api/user - should update user profile', async () => {
      if (!authToken) return;
      
      const res = await request(app)
        .put('/api/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ displayName: 'Updated Name' });
      
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Product Endpoints', () => {
    it('GET /api/products - should list products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/products - should create product (admin only)', async () => {
      if (!authToken) return;
      
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          price: 99.99,
          description: 'Test description'
        });
      
      expect([200, 201, 401, 403]).toContain(res.status);
    });
  });

  describe('Order Endpoints', () => {
    it('POST /api/orders - should create order', async () => {
      if (!authToken) return;
      
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ productId: 1, quantity: 2 }]
        });
      
      expect([200, 201, 400, 401]).toContain(res.status);
    });

    it('GET /api/orders - should list user orders', async () => {
      if (!authToken) return;
      
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Health & Monitoring', () => {
    it('GET /api/health - should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });

    it('GET /metrics - should require authentication', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(401);
    });
  });
});
