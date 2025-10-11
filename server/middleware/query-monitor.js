import { logger } from '../logger';
import { slowQueriesTotal, slowQueriesGauge, dbQueryDuration } from '../monitoring/metrics';
class QueryMonitor {
    constructor() {
        this.metrics = {
            totalQueries: 0,
            slowQueries: 0,
            failedQueries: 0,
            averageQueryTime: 0,
            queries: [],
        };
        this.maxLogSize = 1000;
        this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);
        this.totalDuration = 0;
        this.enableVerboseLogging = process.env.ENABLE_QUERY_LOGGING === 'true';
    }
    logQuery(query, duration, success, error) {
        this.metrics.totalQueries++;
        this.totalDuration += duration;
        this.metrics.averageQueryTime = this.totalDuration / this.metrics.totalQueries;
        const queryLog = {
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
    sanitizeQuery(query) {
        return query
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 500);
    }
    getMetrics() {
        return {
            ...this.metrics,
            queries: this.enableVerboseLogging ? this.metrics.queries.slice(-100) : [],
        };
    }
    resetMetrics() {
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
    getSlowQueries(limit = 10) {
        return this.metrics.queries
            .filter(q => q.duration > this.slowQueryThreshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    getFailedQueries(limit = 10) {
        return this.metrics.queries
            .filter(q => !q.success)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
}
export const queryMonitor = new QueryMonitor();
export function wrapQueryWithMonitoring(queryFn, queryDescription) {
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
