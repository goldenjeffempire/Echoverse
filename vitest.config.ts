
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'server/__tests__/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'dist/',
        'client/'
      ],
      all: true,
      // MED-002 FIX: Enforce 80% code coverage threshold with CI failure
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        '100': false  // Don't require 100% coverage
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './server'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
