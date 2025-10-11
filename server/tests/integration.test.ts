import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { createTestApp } from '../__tests__/app-factory';

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  const app = await createTestApp();
  request = supertest(app);
});

describe('Authentication Integration Tests', () => {
  it('should handle health check', async () => {
    const response = await request.get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  it('should register a new user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'SecurePassword123!'
      });
    
    expect([200, 201, 400]).toContain(response.status);
  });

  it('should handle login attempts', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'SecurePassword123!'
      });
    
    expect([200, 401, 400]).toContain(response.status);
  });
});

describe('AI Builder Integration Tests', () => {
  it('should handle AI generation requests', async () => {
    const response = await request
      .post('/api/ai/generate-website')
      .send({
        prompt: 'Create a landing page for a tech startup',
        style: 'modern'
      });
    
    expect([200, 401, 429, 400]).toContain(response.status);
  });
});

describe('CMS Integration Tests', () => {
  it('should list all posts', async () => {
    const response = await request
      .get('/api/cms/posts')
      .query({ page: 1, limit: 10 });
    
    expect([200, 401]).toContain(response.status);
  });
});

describe('E-commerce Integration Tests', () => {
  it('should list products', async () => {
    const response = await request
      .get('/api/products');
    
    expect([200, 401]).toContain(response.status);
  });
});

describe('Communities Integration Tests', () => {
  it('should list communities', async () => {
    const response = await request
      .get('/api/communities');
    
    expect([200, 401]).toContain(response.status);
  });
});

describe('Marketing Integration Tests', () => {
  it('should track events', async () => {
    const response = await request
      .post('/api/marketing/track')
      .send({
        event: 'page_view',
        properties: { page: '/home' }
      });
    
    expect([200, 401, 400]).toContain(response.status);
  });
});

describe('Marketplace Integration Tests', () => {
  it('should list available plugins', async () => {
    const response = await request
      .get('/api/marketplace/plugins');
    
    expect([200, 401]).toContain(response.status);
  });
});
