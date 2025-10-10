import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import ws from 'k6/ws';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:5000';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has rate limit headers': (r) => r.headers['X-Ratelimit-Limit'] !== undefined,
    }) || errorRate.add(1);
  });

  group('Authentication Flow', () => {
    const registerPayload = JSON.stringify({
      username: `user_${__VU}_${Date.now()}`,
      email: `user${__VU}@test.com`,
      password: 'SecurePassword123!',
    });

    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      registerPayload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    check(registerRes, {
      'registration successful or user exists': (r) => [200, 201, 400].includes(r.status),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('AI Content Generation', () => {
    const aiPayload = JSON.stringify({
      prompt: 'Generate a simple landing page',
      style: 'modern',
    });

    const aiRes = http.post(`${BASE_URL}/api/ai/generate`, aiPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    });

    check(aiRes, {
      'AI response received or rate limited': (r) => [200, 201, 429, 401].includes(r.status),
    }) || errorRate.add(1);

    sleep(2);
  });

  group('CMS Operations', () => {
    const postPayload = JSON.stringify({
      title: `Test Post ${__VU}`,
      content: 'This is a test post content',
      status: 'draft',
    });

    const createPostRes = http.post(
      `${BASE_URL}/api/cms/posts`,
      postPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      }
    );

    check(createPostRes, {
      'post created or auth required': (r) => [200, 201, 401].includes(r.status),
    }) || errorRate.add(1);

    const listPostsRes = http.get(`${BASE_URL}/api/cms/posts?page=1&limit=10`);
    check(listPostsRes, {
      'posts listed': (r) => [200, 401].includes(r.status),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('E-commerce Operations', () => {
    const productPayload = JSON.stringify({
      name: `Product ${__VU}`,
      price: 99.99,
      inventory: 100,
    });

    const createProductRes = http.post(
      `${BASE_URL}/api/products`,
      productPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      }
    );

    check(createProductRes, {
      'product created or auth required': (r) => [200, 201, 401].includes(r.status),
    }) || errorRate.add(1);

    const purchaseRes = http.post(
      `${BASE_URL}/api/products/1/purchase`,
      JSON.stringify({ quantity: 1 }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      }
    );

    check(purchaseRes, {
      'purchase processed': (r) => [200, 201, 400, 401, 404].includes(r.status),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Community Operations', () => {
    const communityPayload = JSON.stringify({
      name: `Community ${__VU}`,
      description: 'A test community',
    });

    const createCommunityRes = http.post(
      `${BASE_URL}/api/communities`,
      communityPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      }
    );

    check(createCommunityRes, {
      'community created or auth required': (r) => [200, 201, 401].includes(r.status),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Marketing Operations', () => {
    const campaignPayload = JSON.stringify({
      name: `Campaign ${__VU}`,
      type: 'email',
      status: 'draft',
    });

    const createCampaignRes = http.post(
      `${BASE_URL}/api/marketing/campaigns`,
      campaignPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      }
    );

    check(createCampaignRes, {
      'campaign created or auth required': (r) => [200, 201, 401].includes(r.status),
    }) || errorRate.add(1);

    const trackingPayload = JSON.stringify({
      event: 'conversion',
      data: { campaignId: 1 },
    });

    const trackRes = http.post(
      `${BASE_URL}/api/marketing/track`,
      trackingPayload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    check(trackRes, {
      'event tracked': (r) => [200, 201, 400].includes(r.status),
    }) || errorRate.add(1);

    sleep(1);
  });

  group('Marketplace Operations', () => {
    const pluginsRes = http.get(`${BASE_URL}/api/marketplace/plugins`);
    check(pluginsRes, {
      'plugins listed': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);
  });

  group('WebSocket Connection', () => {
    const url = `${WS_URL}/ws`;
    const response = ws.connect(url, {}, function (socket) {
      socket.on('open', () => {
        socket.send(JSON.stringify({ type: 'ping' }));
      });

      socket.on('message', (data) => {
        check(data, {
          'received message': (d) => d !== null,
        });
      });

      socket.on('error', (e) => {
        errorRate.add(1);
      });

      socket.setTimeout(() => {
        socket.close();
      }, 1000);
    });

    check(response, {
      'websocket connection established': (r) => r && r.status === 101,
    }) || errorRate.add(1);

    sleep(1);
  });

  sleep(Math.random() * 3);
}
