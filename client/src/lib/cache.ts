/**
 * Client-side caching system
 * Provides request deduplication and cache invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Simple in-memory cache
 */
export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Request deduplication
 * Prevents multiple identical requests from being made simultaneously
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If request is already in progress, return existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Create new request
    const promise = fn().finally(() => {
      // Clean up after request completes
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(key?: string): void {
    if (key) {
      this.pending.delete(key);
    } else {
      this.pending.clear();
    }
  }
}

/**
 * Global instances
 */
export const globalCache = new Cache();
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Cache key builders
 */
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  website: (id: string) => `website:${id}`,
  websites: (userId: string) => `websites:user:${userId}`,
  product: (id: string) => `product:${id}`,
  products: (websiteId: string) => `products:website:${websiteId}`,
  order: (id: string) => `order:${id}`,
  orders: (userId: string) => `orders:user:${userId}`,
  post: (id: string) => `post:${id}`,
  posts: (websiteId: string) => `posts:website:${websiteId}`,
  analytics: (websiteId: string, period: string) => `analytics:${websiteId}:${period}`
};
