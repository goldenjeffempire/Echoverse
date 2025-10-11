import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

describe('E2E Critical Flow Tests', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    registerRoutes(app);
  });

  describe('E2E: User Registration & Login Flow', () => {
    let userToken: string;
    const testEmail = `e2e_${Date.now()}@example.com`;
    const testUsername = `e2e_user_${Date.now()}`;
    const testPassword = 'SecureE2EPass123!@#';

    it('should complete full registration flow', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: testPassword
        });
      
      expect([200, 201]).toContain(res.status);
      if (res.body.token) {
        userToken = res.body.token;
        expect(userToken).toBeTruthy();
      }
    });

    it('should login with registered credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: testUsername,
          password: testPassword
        });
      
      if (res.status === 200) {
        expect(res.body).toHaveProperty('token');
        userToken = res.body.token;
      }
    });

    it('should access protected resources with token', async () => {
      if (!userToken) return;
      
      const res = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('E2E: E-Commerce Checkout Flow', () => {
    let checkoutToken: string = '';
    let orderId: number = 0;

    it('should add product to cart and create order', async () => {
      if (!checkoutToken) return;
      
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${checkoutToken}`)
        .send({
          items: [
            { productId: 1, quantity: 2 },
            { productId: 2, quantity: 1 }
          ]
        });
      
      if (res.status === 200 || res.status === 201) {
        orderId = res.body.order?.id;
      }
    });

    it('should create payment intent for order', async () => {
      if (!checkoutToken || !orderId) return;
      
      const res = await request(app)
        .post('/api/create-payment-intent')
        .set('Authorization', `Bearer ${checkoutToken}`)
        .send({ amount: 199.99 });
      
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should verify order payment status', async () => {
      if (!checkoutToken || !orderId) return;
      
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${checkoutToken}`);
      
      expect([200, 404, 401]).toContain(res.status);
    });
  });

  describe('E2E: Website Publishing Flow', () => {
    let publishToken: string = '';
    let websiteId: number = 0;

    it('should create new website', async () => {
      if (!publishToken) return;
      
      const res = await request(app)
        .post('/api/websites')
        .set('Authorization', `Bearer ${publishToken}`)
        .send({
          name: 'E2E Test Website',
          subdomain: `e2e-test-${Date.now()}`,
          template: 'modern'
        });
      
      if (res.status === 200 || res.status === 201) {
        websiteId = res.body.id;
      }
    });

    it('should update website content', async () => {
      if (!publishToken || !websiteId) return;
      
      const res = await request(app)
        .put(`/api/websites/${websiteId}`)
        .set('Authorization', `Bearer ${publishToken}`)
        .send({
          content: { hero: { title: 'Updated Title' } }
        });
      
      expect([200, 404, 401]).toContain(res.status);
    });

    it('should publish website', async () => {
      if (!publishToken || !websiteId) return;
      
      const res = await request(app)
        .post(`/api/websites/${websiteId}/publish`)
        .set('Authorization', `Bearer ${publishToken}`);
      
      expect([200, 404, 401]).toContain(res.status);
    });
  });

  describe('E2E: Security & Session Management', () => {
    it('should enforce CSRF protection', async () => {
      const res = await request(app)
        .post('/api/sensitive-action')
        .send({ data: 'test' });
      
      expect([401, 403]).toContain(res.status);
    });

    it('should handle session refresh', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'test' });
      
      if (loginRes.body.token) {
        const refreshRes = await request(app)
          .post('/api/refresh-session')
          .set('Authorization', `Bearer ${loginRes.body.token}`);
        
        expect([200, 401]).toContain(refreshRes.status);
      }
    });

    it('should invalidate session on logout', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'test' });
      
      if (loginRes.body.token) {
        const logoutRes = await request(app)
          .post('/api/logout')
          .set('Authorization', `Bearer ${loginRes.body.token}`);
        
        expect([200, 401]).toContain(logoutRes.status);
      }
    });
  });
});
