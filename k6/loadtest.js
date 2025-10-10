/**
 * K6 Load Test Configuration
 * Issue #25: Configure k6 load tests (1000 concurrent users, p95 < 500ms)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 1000 },  // Ramp up to 1000 users (target load)
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    errors: ['rate<0.01'],              // Error rate should be below 1%
    http_req_failed: ['rate<0.01'],    // Less than 1% failed requests
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test various endpoints
  const endpoints = [
    { method: 'GET', url: '/api/health' },
    { method: 'GET', url: '/api/products' },
    { method: 'GET', url: '/api/posts' },
    { method: 'GET', url: '/api/csrf-token' },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  const startTime = Date.now();
  const response = http.get(`${BASE_URL}${endpoint.url}`);
  const duration = Date.now() - startTime;

  // Track metrics
  requestCount.add(1);
  apiLatency.add(duration);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}
