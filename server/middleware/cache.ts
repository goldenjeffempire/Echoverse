import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

/**
 * Simple in-memory cache with TTL support
 * 
 * In production, this should be replaced with Redis for:
 * - Distributed caching across multiple servers
 * - Persistence
 * - Advanced features (pub/sub, sorted sets, etc.)
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, value: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { entriesRemoved: cleaned });
    }
  }

  getStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

export const cache = new MemoryCache();

/**
 * Generate cache key from request
 */
function getCacheKey(req: Request): string {
  const userId = (req as any).user?.id || 'anonymous';
  const query = JSON.stringify(req.query);
  const path = req.path;
  
  return `${path}:${userId}:${query}`;
}

/**
 * Cache middleware for GET requests
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }
    
    const key = getCacheKey(req);
    const cached = cache.get(key);
    
    if (cached) {
      logger.debug('Cache hit', { key, path: req.path });
      
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }
    
    logger.debug('Cache miss', { key, path: req.path });
    res.setHeader('X-Cache', 'MISS');
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttlSeconds);
        logger.debug('Response cached', { key, ttl: ttlSeconds });
      }
      
      return originalJson(body);
    };
    
    next();
  };
}

/**
 * Invalidate cache for a specific pattern
 */
export function invalidateCache(pattern: string): void {
  // In production with Redis, use SCAN or KEYS to find matching keys
  // For now, we'll clear all cache on invalidation
  cache.clear();
  logger.info('Cache invalidated', { pattern });
}

/**
 * Invalidate cache middleware for write operations
 */
export function invalidateCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Invalidate cache after successful write operations
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCache(req.path);
    }
    
    return originalJson(body);
  };
  
  next();
}

/**
 * Cache helper for manual caching
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached) {
    logger.debug('Cache hit', { key });
    return cached;
  }
  
  logger.debug('Cache miss, executing query', { key });
  const result = await queryFn();
  
  cache.set(key, result, ttlSeconds);
  
  return result;
}
