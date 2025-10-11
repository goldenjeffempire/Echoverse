
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// HTTP metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

// Business metrics
export const orderTotal = new Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status'],
  registers: [register]
});

export const revenueTotal = new Counter({
  name: 'revenue_total',
  help: 'Total revenue in USD',
  registers: [register]
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register]
});

// AI metrics
export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total AI requests',
  labelNames: ['provider', 'model'],
  registers: [register]
});

export const aiCostTotal = new Counter({
  name: 'ai_cost_total',
  help: 'Total AI cost in USD',
  labelNames: ['provider'],
  registers: [register]
});

// AI Provider Health metrics
export const aiProviderHealth = new Gauge({
  name: 'ai_provider_health',
  help: 'AI provider health status (1=available, 0=unavailable)',
  labelNames: ['provider', 'type'], // type: primary or fallback
  registers: [register]
});

export const aiProviderConsecutiveFailures = new Gauge({
  name: 'ai_provider_consecutive_failures',
  help: 'Number of consecutive failures for AI provider',
  labelNames: ['provider'],
  registers: [register]
});

export const aiProviderLatencyMs = new Histogram({
  name: 'ai_provider_latency_ms',
  help: 'AI provider health check latency in milliseconds',
  labelNames: ['provider'],
  buckets: [10, 50, 100, 500, 1000, 3000, 5000],
  registers: [register]
});

export const aiProviderCircuitBreakerState = new Gauge({
  name: 'ai_provider_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['provider'],
  registers: [register]
});

// WebSocket metrics
export const wsConnectionsActive = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

export const wsMessagesTotal = new Counter({
  name: 'websocket_messages_total',
  help: 'Total WebSocket messages',
  labelNames: ['type', 'direction'],
  registers: [register]
});

// CRITICAL FIX: WebSocket message latency tracking
export const wsMessageLatency = new Histogram({
  name: 'websocket_message_latency_ms',
  help: 'WebSocket message latency in milliseconds',
  labelNames: ['type'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [register]
});

// CRITICAL FIX: Comprehensive business metrics
export const userRegistrationsTotal = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register]
});

export const conversionRate = new Gauge({
  name: 'conversion_rate',
  help: 'Current conversion rate percentage',
  labelNames: ['funnel_stage'],
  registers: [register]
});

export const userGrowthDaily = new Gauge({
  name: 'user_growth_daily',
  help: 'Daily user growth count',
  registers: [register]
});

export const revenueByProduct = new Counter({
  name: 'revenue_by_product',
  help: 'Revenue by product category',
  labelNames: ['product_category'],
  registers: [register]
});

// CRITICAL FIX: Detailed DB query performance
export const dbQueryPerformance = new Histogram({
  name: 'db_query_performance_detailed',
  help: 'Detailed database query performance',
  labelNames: ['operation', 'table', 'query_type'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

export const dbSlowQueries = new Counter({
  name: 'db_slow_queries_total',
  help: 'Total number of slow database queries (>1s)',
  labelNames: ['table', 'operation'],
  registers: [register]
});

// PHASE 2: API timeout metrics
export const apiTimeoutsTotal = new Counter({
  name: 'api_timeouts_total',
  help: 'Total number of API request timeouts',
  labelNames: ['method', 'path'],
  registers: [register]
});

// PHASE 2: Stripe circuit breaker metrics
export const stripeCircuitBreakerState = new Gauge({
  name: 'stripe_circuit_breaker_state',
  help: 'Stripe circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
  registers: [register]
});

export const stripeCircuitBreakerFailures = new Gauge({
  name: 'stripe_circuit_breaker_failures',
  help: 'Number of consecutive Stripe API failures',
  registers: [register]
});

// PHASE 2.2 & 5.2: Slow query metrics  
export const slowQueriesTotal = new Counter({
  name: 'db_slow_queries_by_threshold_total',
  help: 'Total number of slow database queries by threshold',
  labelNames: ['threshold_ms'],
  registers: [register]
});

export const slowQueriesGauge = new Gauge({
  name: 'db_slow_queries_count',
  help: 'Current count of slow queries detected',
  registers: [register]
});

// PHASE 2.4: Replication lag metrics
export const replicationLagSeconds = new Gauge({
  name: 'db_replication_lag_seconds',
  help: 'Database replication lag in seconds',
  registers: [register]
});

export const replicationLagBytes = new Gauge({
  name: 'db_replication_lag_bytes',
  help: 'Database replication lag in bytes',
  registers: [register]
});

// PHASE 1.3: WebSocket auth rate limiting metrics
export const wsAuthAttemptsTotal = new Counter({
  name: 'websocket_auth_attempts_total',
  help: 'Total WebSocket authentication attempts',
  registers: [register]
});

export const wsAuthRateLimitBlocksTotal = new Counter({
  name: 'websocket_auth_rate_limit_blocks_total',
  help: 'Total WebSocket auth attempts blocked by rate limiting',
  registers: [register]
});

// PHASE 5.4: Per-user WebSocket connection tracking
export const wsConnectionsPerUser = new Gauge({
  name: 'websocket_connections_per_user',
  help: 'Number of WebSocket connections per user',
  labelNames: ['user_id'],
  registers: [register]
});
