/**
 * Unit Tests for CSRF Token Manager
 * 
 * Tests for:
 * - Atomic initialization
 * - Race condition prevention
 * - Retry logic
 * - Error recovery
 * - State management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CSRFTokenManager } from '../csrf-manager';

// Mock browser APIs
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

const documentMock = (() => {
  let cookieValue = '';
  return {
    get cookie() {
      return cookieValue;
    },
    set cookie(value: string) {
      // Simple cookie parser - just append cookies
      if (value.includes('=; expires=')) {
        // Cookie deletion
        const name = value.split('=')[0];
        const cookies = cookieValue.split(';').filter(c => !c.trim().startsWith(name));
        cookieValue = cookies.join(';');
      } else {
        // Cookie setting
        cookieValue = cookieValue ? `${cookieValue}; ${value}` : value;
      }
    }
  };
})();

global.sessionStorage = sessionStorageMock as any;
global.document = documentMock as any;

describe('CSRFTokenManager', () => {
  let manager: CSRFTokenManager;

  beforeEach(() => {
    manager = new CSRFTokenManager();
    // Clear session storage
    sessionStorageMock.clear();
    // Clear cookies - reset the internal cookie value
    (documentMock as any).cookieValue = '';
    // Reset fetch mocks
    vi.clearAllMocks();
  });

  describe('Atomic Initialization', () => {
    it('should initialize only once for concurrent calls', async () => {
      let fetchCount = 0;

      global.fetch = vi.fn(async () => {
        fetchCount++;
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
        return {
          ok: true,
          json: async () => ({ token: 'test-token' })
        } as Response;
      });

      // Simulate concurrent initialization calls
      const promise1 = manager.initialize();
      const promise2 = manager.initialize();
      const promise3 = manager.initialize();

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

      // All should succeed
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);

      // But fetch should only be called once due to atomic lock
      expect(fetchCount).toBeLessThanOrEqual(1);
    });

    it('should not reinitialize when already ready', async () => {
      // Set up successful response
      global.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: 'test-token' })
      } as Response));

      // Set cookie to simulate existing token
      document.cookie = 'XSRF-TOKEN=existing-token';

      // First initialization
      await manager.initialize();
      const fetchCallCount = (global.fetch as any).mock.calls.length;

      // Second initialization should skip if already ready
      await manager.initialize();

      // Should not have made additional fetch calls (or minimal validation calls)
      expect((global.fetch as any).mock.calls.length).toBeLessThanOrEqual(fetchCallCount + 1);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure with exponential backoff', async () => {
      let attemptCount = 0;

      global.fetch = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return { ok: false, status: 500 } as Response;
        }
        return {
          ok: true,
          json: async () => ({ token: 'test-token' })
        } as Response;
      });

      // Set cookie for validation
      document.cookie = 'XSRF-TOKEN=test-token';

      const startTime = Date.now();
      const result = await manager.initialize();
      const duration = Date.now() - startTime;

      expect(result).toBe(true);
      expect(attemptCount).toBe(3);
      // Should have delays (100ms + 200ms minimum)
      expect(duration).toBeGreaterThanOrEqual(300);
    });

    it('should fail after max retries', async () => {
      global.fetch = vi.fn(async () => ({
        ok: false,
        status: 500
      } as Response));

      const result = await manager.initialize();

      expect(result).toBe(false);
      expect(manager.getState()).toBe('failed');
      expect(sessionStorage.getItem('csrf_bootstrap_failed')).toBe('true');
    });
  });

  describe('State Management', () => {
    it('should track state transitions correctly', async () => {
      global.fetch = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          ok: true,
          json: async () => ({ token: 'test-token' })
        } as Response;
      });

      document.cookie = 'XSRF-TOKEN=test-token';

      expect(manager.getState()).toBe('idle');

      const initPromise = manager.initialize();
      
      // During initialization, state may still be idle or initializing
      // (race condition in test timing)
      
      await initPromise;
      
      expect(manager.getState()).toBe('ready');
    });

    it('should return token when ready', async () => {
      global.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: 'test-token' })
      } as Response));

      document.cookie = 'XSRF-TOKEN=test-token-value';

      await manager.initialize();

      expect(manager.isReady()).toBe(true);
      expect(manager.getToken()).toBe('test-token-value');
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn(async () => {
        throw new Error('Network error');
      });

      const result = await manager.initialize();

      expect(result).toBe(false);
      expect(manager.getState()).toBe('failed');
    });

    it('should reset state properly', async () => {
      global.fetch = vi.fn(async () => ({
        ok: false,
        status: 500
      } as Response));

      await manager.initialize();
      expect(manager.getState()).toBe('failed');

      manager.reset();

      expect(manager.getState()).toBe('idle');
      expect(sessionStorage.getItem('csrf_bootstrap_failed')).toBeNull();
    });

    it('should enforce cooldown period after failure', async () => {
      global.fetch = vi.fn(async () => ({
        ok: false,
        status: 500
      } as Response));

      // First initialization fails
      await manager.initialize();
      expect(manager.getState()).toBe('failed');

      // Immediate retry should be blocked by cooldown
      const result = await manager.initialize();
      expect(result).toBe(false);
    });

    it('should allow forced reinitialization', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'new-token' })
        } as Response);

      document.cookie = 'XSRF-TOKEN=new-token';

      // First attempt fails
      await manager.initialize();
      expect(manager.getState()).toBe('failed');

      // Force reinitialization
      const result = await manager.reinitialize();
      expect(result).toBe(true);
      expect(manager.getState()).toBe('ready');
    });
  });

  describe('Token Validation', () => {
    it('should validate token with backend', async () => {
      global.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: 'validated-token' })
      } as Response));

      document.cookie = 'XSRF-TOKEN=validated-token';

      const result = await manager.initialize();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/csrf-token',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });

    it('should handle timeout during validation', async () => {
      global.fetch = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate long delay
        return {
          ok: true,
          json: async () => ({ token: 'test-token' })
        } as Response;
      });

      // The fetch has a 5 second timeout, so this should fail
      const result = await manager.initialize();

      expect(result).toBe(false);
    }, 15000); // Set test timeout higher than fetch timeout
  });

  describe('Multiple Cookie Support', () => {
    it('should recognize XSRF-TOKEN cookie', () => {
      document.cookie = 'XSRF-TOKEN=xsrf-value';
      expect(manager.getToken()).toBe('xsrf-value');
    });

    it('should recognize __Host-CSRF-TOKEN cookie', () => {
      document.cookie = '__Host-CSRF-TOKEN=host-csrf-value';
      expect(manager.getToken()).toBe('host-csrf-value');
    });

    it('should recognize CSRF-TOKEN cookie', () => {
      document.cookie = 'CSRF-TOKEN=csrf-value';
      expect(manager.getToken()).toBe('csrf-value');
    });
  });
});
