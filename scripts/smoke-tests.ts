#!/usr/bin/env tsx
/**
 * MED-005 FIX: Post-Deployment Smoke Tests
 * Critical path validation after deployment
 */

import axios from 'axios';

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:5000';
const API_KEY = process.env.SMOKE_TEST_API_KEY || '';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const tests: Array<() => Promise<TestResult>> = [
  // Test 1: Health Check
  async () => {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
      return {
        name: 'Health Check',
        passed: response.status === 200 && response.data.status === 'healthy',
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'Health Check',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  },

  // Test 2: Database Connectivity
  async () => {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/api/health/db`, { timeout: 10000 });
      return {
        name: 'Database Connectivity',
        passed: response.status === 200 && response.data.database === 'connected',
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'Database Connectivity',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  },

  // Test 3: Authentication Flow
  async () => {
    const start = Date.now();
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/csrf-token`, {}, { timeout: 5000 });
      return {
        name: 'Authentication Flow',
        passed: response.status === 200 && !!response.data.csrfToken,
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'Authentication Flow',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  },

  // Test 4: Metrics Endpoint (with auth)
  async () => {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/metrics`, {
        headers: { 'x-api-key': API_KEY },
        timeout: 5000
      });
      return {
        name: 'Metrics Endpoint',
        passed: response.status === 200,
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'Metrics Endpoint',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  },

  // Test 5: Static Assets
  async () => {
    const start = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
      return {
        name: 'Static Assets',
        passed: response.status === 200,
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'Static Assets',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }
];

async function runSmokeTests(): Promise<void> {
  console.log('\n🔥 Running Post-Deployment Smoke Tests\n');
  console.log(`Target: ${BASE_URL}\n`);

  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await test();
    results.push(result);

    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${result.name}: ${status} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`\n📊 Results: ${passedCount} passed, ${failedCount} failed\n`);

  if (failedCount > 0) {
    console.error('❌ Smoke tests FAILED - Deployment validation failed');
    process.exit(1);
  }

  console.log('✅ All smoke tests PASSED - Deployment validated\n');
  process.exit(0);
}

runSmokeTests().catch(error => {
  console.error('❌ Smoke tests crashed:', error);
  process.exit(1);
});
