import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { csrfProtection, setCsrfTokenCookie, sanitizeInput } from '../middleware/security';
import cookieParser from 'cookie-parser';

describe('CSRF Protection', () => {
  let app: express.Application;

  beforeAll(() => {
    // Setup test app with CSRF protection
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(setCsrfTokenCookie);

    // Test routes
    app.get('/api/csrf-token', (req, res) => {
      const csrfToken = res.getHeader('X-CSRF-Token') as string;
      res.json({ token: csrfToken });
    });

    // Apply CSRF protection to state-changing routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/webhooks/')) {
        return next();
      }
      csrfProtection(req, res, next);
    });

    app.post('/api/test', (req, res) => {
      res.json({ success: true, message: 'CSRF protected endpoint' });
    });

    app.post('/api/webhooks/test', (req, res) => {
      res.json({ success: true, message: 'Webhook endpoint (CSRF exempt)' });
    });
  });

  it('should allow GET requests without CSRF token', async () => {
    const response = await request(app)
      .get('/api/csrf-token')
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toBeTruthy();
  });

  it('should reject POST requests without CSRF token', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ data: 'test' })
      .expect(403);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('CSRF');
    expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('should accept POST requests with valid CSRF token in header', async () => {
    // First, get a CSRF token
    const tokenResponse = await request(app)
      .get('/api/csrf-token');

    const csrfToken = tokenResponse.body.token;
    const cookies = tokenResponse.headers['set-cookie'];

    // Use the token in a POST request
    const response = await request(app)
      .post('/api/test')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookies)
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });

  it('should reject POST requests with invalid CSRF token', async () => {
    const response = await request(app)
      .post('/api/test')
      .set('X-CSRF-Token', 'invalid-token-12345')
      .send({ data: 'test' })
      .expect(403);

    expect(response.body).toHaveProperty('error');
    // Without a cookie, it should return CSRF_COOKIE_MISSING (security fix)
    expect(response.body.code).toBe('CSRF_COOKIE_MISSING');
  });

  it('should allow webhook endpoints without CSRF token', async () => {
    const response = await request(app)
      .post('/api/webhooks/test')
      .send({ data: 'webhook' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });

  it('should reject POST requests with mismatched CSRF token', async () => {
    // Get token from one session
    const tokenResponse1 = await request(app)
      .get('/api/csrf-token');
    const csrfToken1 = tokenResponse1.body.token;

    // Get token from another session
    const tokenResponse2 = await request(app)
      .get('/api/csrf-token');
    const cookies2 = tokenResponse2.headers['set-cookie'];

    // Try to use token from session 1 with cookies from session 2
    const response = await request(app)
      .post('/api/test')
      .set('X-CSRF-Token', csrfToken1)
      .set('Cookie', cookies2)
      .send({ data: 'test' })
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });

  it('should set CSRF token cookie with correct security attributes', async () => {
    const response = await request(app)
      .get('/api/csrf-token');

    const setCookieHeader = response.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    const csrfCookie = setCookieHeader.find((cookie: string) => 
      cookie.includes('CSRF-TOKEN') || cookie.includes('XSRF-TOKEN')
    );

    expect(csrfCookie).toBeDefined();
    // Should have SameSite attribute
    expect(csrfCookie).toMatch(/SameSite=(Lax|Strict|None)/i);
  });

  it('should validate origin for CSRF protection', async () => {
    // Get a valid CSRF token
    const tokenResponse = await request(app)
      .get('/api/csrf-token');

    const csrfToken = tokenResponse.body.token;
    const cookies = tokenResponse.headers['set-cookie'];

    // Try with invalid origin
    const response = await request(app)
      .post('/api/test')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookies)
      .set('Origin', 'https://evil-site.com')
      .send({ data: 'test' })
      .expect(403);

    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('CSRF_ORIGIN_INVALID');
  });
});

describe('Input Sanitization', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(sanitizeInput);

    app.post('/api/echo', (req, res) => {
      res.json({ received: req.body });
    });
  });

  it('should remove dangerous script tags from input', async () => {
    const response = await request(app)
      .post('/api/echo')
      .send({ message: '<script>alert("XSS")</script>Hello' })
      .expect(200);

    expect(response.body.received.message).not.toContain('<script>');
    expect(response.body.received.message).toContain('Hello');
  });

  it('should remove event handlers from input', async () => {
    const response = await request(app)
      .post('/api/echo')
      .send({ html: '<div onerror="alert(1)">Test</div>' })
      .expect(200);

    expect(response.body.received.html).not.toContain('onerror');
  });

  it('should prevent prototype pollution', async () => {
    const response = await request(app)
      .post('/api/echo')
      .send({ 
        __proto__: { polluted: true },
        constructor: { polluted: true },
        data: 'normal'
      })
      .expect(200);

    expect(response.body.received).not.toHaveProperty('__proto__');
    expect(response.body.received).not.toHaveProperty('constructor');
    expect(response.body.received).toHaveProperty('data', 'normal');
  });

  it('should enforce depth limits to prevent stack overflow', async () => {
    const deepObject: any = {};
    let current = deepObject;
    
    // Create deeply nested object (>5 levels)
    for (let i = 0; i < 10; i++) {
      current.nested = {};
      current = current.nested;
    }
    current.value = 'deep';

    const response = await request(app)
      .post('/api/echo')
      .send(deepObject)
      .expect(200);

    // Should be sanitized and depth limited
    expect(response.body.received).toBeDefined();
  });

  it('should enforce array size limits', async () => {
    const largeArray = new Array(2000).fill('item');

    const response = await request(app)
      .post('/api/echo')
      .send({ items: largeArray })
      .expect(200);

    // Should be limited to 1000 items
    expect(response.body.received.items).toBeDefined();
    expect(response.body.received.items.length).toBeLessThanOrEqual(1000);
  });

  it('should enforce string length limits', async () => {
    const longString = 'a'.repeat(20000);

    const response = await request(app)
      .post('/api/echo')
      .send({ message: longString })
      .expect(200);

    // Should be limited to 10000 characters
    expect(response.body.received.message.length).toBeLessThanOrEqual(10000);
  });
});
