/**
 * k6 Load Testing Script
 * Tests critical API endpoints under load
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1']
  }
};

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check response time < 500ms': (r) => r.timings.duration < 500
    });
    errorRate.add(res.status !== 200);
    apiLatency.add(res.timings.duration);
  });

  sleep(1);

  group('Public API Endpoints', () => {
    const endpoints = [
      '/api/posts',
      '/api/products',
      '/api/communities'
    ];

    endpoints.forEach(endpoint => {
      const res = http.get(`${BASE_URL}${endpoint}`);
      check(res, {
        [`${endpoint} status 200`]: (r) => r.status === 200,
        [`${endpoint} response time < 2000ms`]: (r) => r.timings.duration < 2000
      });
      errorRate.add(res.status !== 200);
      apiLatency.add(res.timings.duration);
    });
  });

  sleep(1);

  group('Authentication Flow', () => {
    const csrfRes = http.get(`${BASE_URL}/api/csrf-token`);
    check(csrfRes, {
      'CSRF token retrieved': (r) => r.status === 200
    });

    const registerPayload = JSON.stringify({
      username: `loadtest_${Date.now()}_${__VU}_${__ITER}`,
      email: `loadtest_${Date.now()}_${__VU}_${__ITER}@test.com`,
      password: 'TestPassword123!'
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfRes.json('csrfToken') || ''
      }
    };

    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      registerPayload,
      params
    );

    check(registerRes, {
      'registration succeeds or user exists': (r) => r.status === 201 || r.status === 400
    });
  });

  sleep(2);

  group('Static Assets', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'homepage loads': (r) => r.status === 200,
      'homepage response time < 1000ms': (r) => r.timings.duration < 1000
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Load Test Summary:\n`;
  summary += `${indent}==================\n\n`;
  
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  p50: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;

  summary += `${indent}Virtual Users: ${data.metrics.vus.values.value}\n`;
  summary += `${indent}Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n\n`;

  if (data.metrics.errors) {
    const errorRate = (data.metrics.errors.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorRate}%\n`;
  }

  return summary;
}
