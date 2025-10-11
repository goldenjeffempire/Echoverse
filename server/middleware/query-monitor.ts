import { logger } from '../logger';
import { slowQueriesTotal, slowQueriesGauge, dbQueryDuration } from '../monitoring/metrics';

export interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  queries: QueryLog[];
}

export interface QueryLog {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class QueryMonitor {
  private metrics: QueryMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    failedQueries: 0,
    averageQueryTime: 0,
    queries: [],
  };
  
  private readonly maxLogSize = 1000;
  private readonly slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);
  private totalDuration = 0;
  private readonly enableVerboseLogging = process.env.ENABLE_QUERY_LOGGING === 'true';

  logQuery(query: string, duration: number, success: boolean, error?: string): void {
    this.metrics.totalQueries++;
    this.totalDuration += duration;
    this.metrics.averageQueryTime = this.totalDuration / this.metrics.totalQueries;

    const queryLog: QueryLog = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      success,
      error,
    };

    if (!success) {
      this.metrics.failedQueries++;
      logger.error('Query failed', undefined, {
        query: this.sanitizeQuery(query),
        duration,
        errorMessage: error,
      });
    }

    const isSlow = duration > this.slowQueryThreshold;
    const isFailure = !success;
    const shouldLog = this.enableVerboseLogging || isSlow || isFailure;

    if (isSlow) {
      this.metrics.slowQueries++;
      
      // PHASE 2.2 & 5.2: Export slow query metrics to Prometheus
      slowQueriesTotal.inc({ threshold_ms: this.slowQueryThreshold.toString() });
      slowQueriesGauge.set(this.metrics.slowQueries);
      
      logger.warn('Slow query detected', {
        query: this.sanitizeQuery(query),
        duration,
        threshold: this.slowQueryThreshold,
      });
    }
    
    // Export query duration to Prometheus
    if (success) {
      dbQueryDuration.observe({ operation: 'query', table: 'unknown' }, duration / 1000);
    }

    if (shouldLog) {
      this.metrics.queries.push(queryLog);

      if (this.metrics.queries.length > this.maxLogSize) {
        this.metrics.queries.shift();
      }
    }
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }

  getMetrics(): QueryMetrics {
    return {
      ...this.metrics,
      queries: this.enableVerboseLogging ? this.metrics.queries.slice(-100) : [],
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      queries: [],
    };
    this.totalDuration = 0;
    logger.info('Query metrics reset');
  }

  getSlowQueries(limit: number = 10): QueryLog[] {
    return this.metrics.queries
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getFailedQueries(limit: number = 10): QueryLog[] {
    return this.metrics.queries
      .filter(q => !q.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const queryMonitor = new QueryMonitor();

export function wrapQueryWithMonitoring<T>(
  queryFn: () => Promise<T>,
  queryDescription: string
): Promise<T> {
  const startTime = Date.now();
  
  return queryFn()
    .then((result) => {
      const duration = Date.now() - startTime;
      queryMonitor.logQuery(queryDescription, duration, true);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      queryMonitor.logQuery(queryDescription, duration, false, error.message);
      throw error;
    });
}
