# Database Connection Pool Documentation
**FIX #9: Connection Pool Optimization Documentation**

## Overview

The EchoVerse database connection pool is optimized for production workloads with automatic scaling, monitoring, and alerting capabilities.

## Configuration

### Environment Variables

```bash
# Connection Pool Settings
DB_POOL_MAX=30              # Maximum connections (default: 30)
DB_POOL_MIN=3               # Minimum connections (default: 3)
DB_IDLE_TIMEOUT=60000       # Idle timeout in ms (default: 60000)
DB_CONNECTION_TIMEOUT=30000 # Connection timeout in ms (default: 30000)
DB_STATEMENT_TIMEOUT=30000  # Statement timeout in ms (default: 30000)
```

### Pool Settings

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Max Connections | 30 | 10-50 | Maximum pool size |
| Min Connections | 3 | 3-10 | Minimum pool size |
| Idle Timeout | 60s | 30s-120s | Connection idle timeout |
| Connection Timeout | 30s | 10s-60s | New connection timeout |
| Statement Timeout | 30s | 10s-60s | Query execution timeout |

## Auto-Scaling

The pool automatically scales based on utilization:

### Scaling Thresholds

- **Scale Up**: When utilization > 80%
- **Scale Down**: When utilization < 40%

### Scaling Increments

- **Scale Up**: +5 connections
- **Scale Down**: -2 connections

### Limits

- **Absolute Maximum**: 50 connections
- **Absolute Minimum**: 3 connections
- **Cooldown Period**: 60 seconds

## Monitoring

### Health Checks

The pool is monitored every 30 seconds for:

- **Connection utilization** (%)
- **Waiting clients** (count)
- **Active connections** (count)
- **Idle connections** (count)

### Alerts

#### Critical Alerts

- Pool utilization > 90%
- Waiting clients > 5
- Pool cannot scale further

#### Warning Alerts

- Pool utilization > 75%
- Frequent scaling events

### Metrics Endpoint

```bash
GET /api/health/db
```

Response:
```json
{
  "status": "healthy",
  "pool": {
    "total": 25,
    "idle": 10,
    "waiting": 0,
    "max": 30,
    "utilization": 83.3
  },
  "latency_ms": 5
}
```

## Best Practices

### Connection Management

1. **Always use connection pooling** - Never create direct connections
2. **Close connections promptly** - Return to pool after use
3. **Handle errors gracefully** - Ensure cleanup on failure
4. **Monitor pool stats** - Watch for exhaustion patterns

### Query Optimization

1. **Use prepared statements** - Better performance and security
2. **Set statement timeouts** - Prevent long-running queries
3. **Batch operations** - Reduce connection overhead
4. **Use transactions wisely** - Don't hold connections unnecessarily

### Scaling Guidelines

#### When to Scale Up

- Consistent utilization > 70%
- Frequent waiting clients
- Response time degradation
- Increased traffic patterns

#### When to Scale Down

- Consistent utilization < 30%
- Over-provisioned resources
- Cost optimization needs

### Production Recommendations

For different workload types:

#### Light Load (< 100 req/s)
```bash
DB_POOL_MAX=20
DB_POOL_MIN=5
```

#### Medium Load (100-500 req/s)
```bash
DB_POOL_MAX=30
DB_POOL_MIN=10
```

#### Heavy Load (> 500 req/s)
```bash
DB_POOL_MAX=50
DB_POOL_MIN=15
```

## Troubleshooting

### Pool Exhaustion

**Symptoms**:
- "Too many clients" errors
- Requests timing out
- High waiting client count

**Solutions**:
1. Increase `DB_POOL_MAX` (up to 50)
2. Optimize slow queries
3. Implement connection retry logic
4. Add read replicas for read-heavy workloads

### Connection Leaks

**Symptoms**:
- Gradual increase in active connections
- Pool never scales down
- "FATAL: remaining connection slots reserved"

**Solutions**:
1. Audit code for unclosed connections
2. Use connection lifecycle logging
3. Implement connection timeout enforcement
4. Review error handling paths

### High Latency

**Symptoms**:
- Slow query execution
- Timeout errors
- High p99 latency

**Solutions**:
1. Add database indexes
2. Optimize query patterns
3. Use query result caching
4. Implement read replicas

## Monitoring & Alerts

### Key Metrics to Track

1. **Pool Utilization** (%): Target < 80%
2. **Waiting Clients**: Target = 0
3. **Query Latency** (ms): Target < 100ms p99
4. **Connection Errors**: Target = 0

### Alert Configuration

```yaml
# Prometheus Alert Rules
groups:
  - name: database_pool
    interval: 30s
    rules:
      - alert: DatabasePoolExhausted
        expr: db_pool_utilization > 90
        for: 5m
        annotations:
          summary: "Database pool nearly exhausted"
          
      - alert: DatabasePoolWaitingClients
        expr: db_pool_waiting_clients > 5
        for: 2m
        annotations:
          summary: "High number of waiting database clients"
```

## Circuit Breaker Integration

The connection pool integrates with the circuit breaker pattern:

- **Opens circuit** when pool utilization > 90%
- **Half-open** when utilization drops to < 80%
- **Closes circuit** when utilization is healthy

## Code Examples

### Using the Pool

```typescript
import { db } from './db';

// Automatic connection management
const users = await db.select().from(users).limit(10);

// With transaction
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  await tx.insert(orders).values({ userId: 1 });
});
```

### Monitoring Pool Status

```typescript
import { getDatabaseStats } from './db';

const stats = getDatabaseStats();
console.log('Pool utilization:', stats.utilization);
```

## Performance Tuning

### Connection Pooling Formula

```
max_connections = (core_count * 2) + effective_spindle_count
```

For most cloud databases:
```
max_connections = cores * 2 + 4
```

### PostgreSQL Server Settings

Ensure PostgreSQL is configured:

```sql
-- Check current settings
SHOW max_connections;
SHOW shared_buffers;

-- Recommended for production
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

## Summary

The database connection pool is production-ready with:

✅ Automatic scaling (3-50 connections)  
✅ Real-time monitoring and alerting  
✅ Circuit breaker integration  
✅ Comprehensive health checks  
✅ Performance optimization  

Monitor the pool dashboard and adjust settings based on your workload patterns.
