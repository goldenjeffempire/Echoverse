/**
 * Simple In-Memory Cache with TTL
 * Used for caching static data like products, posts, etc.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class InMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Cache cleanup completed - expired entries removed
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresIn: Math.max(0, entry.expiresAt - Date.now())
      }))
    };
  }
}

// Global cache instance
export const cache = new InMemoryCache(300000); // 5 minutes TTL

// Cache key generators
export const cacheKeys = {
  products: (filters: Record<string, unknown>) => `products:${JSON.stringify(filters)}`,
  product: (id: string) => `product:${id}`,
  posts: (filters: Record<string, unknown>) => `posts:${JSON.stringify(filters)}`,
  post: (id: string) => `post:${id}`,
  communities: (filters: Record<string, unknown>) => `communities:${JSON.stringify(filters)}`,
  plugins: (filters: Record<string, unknown>) => `plugins:${JSON.stringify(filters)}`
};
