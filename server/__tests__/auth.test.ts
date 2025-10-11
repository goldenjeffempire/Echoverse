
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

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

beforeEach(async () => {
  // Clean up test users
  await db.delete(users).where(eq(users.email, 'test@example.com'));
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate emails', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      token = loginResponse.body.token;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });

    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
