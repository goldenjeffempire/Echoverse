# Distributed Locking Guide

## Overview
This document describes the distributed locking mechanisms implemented in the application to prevent duplicate execution of background jobs and critical operations in multi-instance deployments.

## ISSUE #22 FIX: Distributed Locking for Background Jobs

The application implements distributed locking using multiple strategies depending on the use case.

## Lock Implementations

### 1. PostgreSQL Advisory Locks (Migrations)

**Use Case**: Database migrations  
**Location**: `scripts/run-migrations.sh`  
**Implementation**: PostgreSQL's built-in advisory locks

```bash
# Acquire lock
pg_try_advisory_lock(LOCK_ID)

# Release lock
pg_advisory_unlock(LOCK_ID)
```

**Features**:
- Session-scoped locks (automatically released on connection close)
- Non-blocking with timeout/retry
- Integer-based lock IDs for migrations (use migration version number)

**Example**:
```bash
# Migration lock ID based on hash of operation
LOCK_ID=12345678

# Try to acquire lock
result=$(psql "$DATABASE_URL" -tAc "SELECT pg_try_advisory_lock($LOCK_ID);")

if [ "$result" = "t" ]; then
    # Lock acquired, run operation
    run_migration
    
    # Release lock
    psql "$DATABASE_URL" -tAc "SELECT pg_advisory_unlock($LOCK_ID);"
fi
```

### 2. Redis-Based Distributed Locks (Session Operations)

**Use Case**: Refresh token operations, session management  
**Location**: `server/utils/refresh-token-lock.ts`  
**Implementation**: In-memory map (production should use Redis)

**Current Implementation** (Development):
```typescript
const refreshLocks = new Map<string, RefreshLock>();

// Acquire lock with retry
export async function acquireRefreshLock(
  sessionId: string, 
  attempt: number = 1
): Promise<boolean> {
  const now = Date.now();
  const existingLock = refreshLocks.get(sessionId);

  if (existingLock && existingLock.expiresAt > now) {
    // Lock held, retry with exponential backoff
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      return false;
    }
    
    const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    return acquireRefreshLock(sessionId, attempt + 1);
  }

  refreshLocks.set(sessionId, {
    sessionId,
    acquiredAt: now,
    expiresAt: now + LOCK_TIMEOUT
  });
  
  return true;
}

// Release lock
export function releaseRefreshLock(sessionId: string): void {
  refreshLocks.delete(sessionId);
}
```

**Production Recommendation** (Redis):
```typescript
import { getRedisClient } from '../config/redis-production';

export async function acquireRefreshLock(
  sessionId: string,
  ttlSeconds: number = 10
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis not available for distributed locking');
  }
  
  const lockKey = `lock:refresh:${sessionId}`;
  const result = await redis.set(lockKey, '1', {
    NX: true,      // Only set if not exists
    EX: ttlSeconds // Expire after TTL
  });
  
  return result === 'OK';
}

export async function releaseRefreshLock(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  await redis.del(`lock:refresh:${sessionId}`);
}
```

### 3. Database Transaction Locks (Critical Operations)

**Use Case**: Session creation, inventory management, payment processing  
**Location**: `server/storage.ts`  
**Implementation**: PostgreSQL `FOR UPDATE` within transactions

```typescript
async createSessionWithLimit(userId: string, session: Session, maxSessions: number): Promise<Session> {
  return await db.transaction(async (tx) => {
    // SERIALIZABLE isolation for strictest consistency
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
    
    // Lock user row to prevent concurrent session creation
    await tx.execute(
      sql`SELECT 1 FROM ${users} 
          WHERE ${users.id} = ${userId} 
          FOR UPDATE NOWAIT`
    );
    
    // Perform operations atomically
    // ... cleanup, count, create session
    
    return newSession;
  });
}
```

**Features**:
- ACID guarantees within transaction
- NOWAIT fails fast if lock unavailable
- Automatic rollback on error
- Automatically released on transaction commit/rollback

## Background Job Patterns

### Pattern 1: Advisory Lock for Scheduled Jobs

```typescript
// server/jobs/scheduled-job.ts
import { db } from '../db';
import { sql } from 'drizzle-orm';

const JOB_LOCK_ID = 999888777; // Unique ID for this job type

export async function runScheduledJob() {
  const pool = await import('../db').then(m => m.pool);
  const client = await pool.connect();
  
  try {
    // Try to acquire lock
    const result = await client.query(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      [JOB_LOCK_ID]
    );
    
    if (!result.rows[0].acquired) {
      logger.info('Job already running in another instance, skipping');
      return;
    }
    
    logger.info('Lock acquired, running job');
    
    // Run the actual job
    await performJobLogic();
    
    logger.info('Job completed successfully');
    
  } finally {
    // Release lock
    await client.query('SELECT pg_advisory_unlock($1)', [JOB_LOCK_ID]);
    client.release();
  }
}
```

### Pattern 2: Redis Lock for Distributed Tasks

```typescript
// server/jobs/distributed-task.ts
import { getRedisClient } from '../config/redis-production';

const LOCK_TTL = 300; // 5 minutes

export async function runDistributedTask(taskId: string) {
  const redis = getRedisClient();
  const lockKey = `lock:task:${taskId}`;
  
  // Try to acquire lock
  const acquired = await redis.set(lockKey, process.pid.toString(), {
    NX: true,
    EX: LOCK_TTL
  });
  
  if (!acquired) {
    logger.info(`Task ${taskId} locked by another instance`);
    return;
  }
  
  try {
    // Run task
    await performTask(taskId);
    
  } finally {
    // Release lock
    await redis.del(lockKey);
  }
}
```

### Pattern 3: Database Row Lock for Per-Entity Jobs

```typescript
// server/jobs/user-sync-job.ts
import { db } from '../db';
import { users } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

export async function syncUserData(userId: string) {
  return await db.transaction(async (tx) => {
    // Lock specific user row
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .for('update', { skipLocked: true });
    
    if (!user) {
      logger.info(`User ${userId} locked, skipping`);
      return;
    }
    
    // Perform sync for this user
    await performUserSync(user);
  });
}
```

## Best Practices

### 1. Choose the Right Lock Type

| Use Case | Recommended Lock | Why |
|----------|------------------|-----|
| Database migrations | PostgreSQL Advisory | Single database operation |
| Background jobs | Redis | Multi-instance deployment |
| User-specific operations | Transaction FOR UPDATE | Row-level locking |
| Short critical sections | In-memory | Low latency needs |

### 2. Always Set Timeouts

```typescript
// BAD: No timeout
await redis.set(lockKey, '1', { NX: true });

// GOOD: With TTL
await redis.set(lockKey, '1', { NX: true, EX: 300 });
```

### 3. Use Try-Finally for Cleanup

```typescript
const lockAcquired = await acquireLock(resource);
if (!lockAcquired) return;

try {
  // Perform locked operation
  await doWork();
} finally {
  // Always release lock
  await releaseLock(resource);
}
```

### 4. Implement Exponential Backoff for Retries

```typescript
async function acquireLockWithRetry(
  resource: string,
  maxAttempts: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await acquireLock(resource)) {
      return true;
    }
    
    // Exponential backoff: 200ms, 400ms, 800ms
    const delay = 200 * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return false;
}
```

### 5. Log Lock Operations

```typescript
logger.info('Attempting to acquire lock', { resource, attempt });
logger.info('Lock acquired', { resource, duration });
logger.warn('Lock acquisition failed', { resource, reason });
```

## Production Checklist

- [ ] Redis configured for distributed locking (`REDIS_URL` set)
- [ ] Lock timeouts configured appropriately for job duration
- [ ] Dead letter queue for jobs that fail to acquire locks
- [ ] Monitoring for lock contention and timeout rates
- [ ] Alerts for excessive lock wait times
- [ ] Documentation of all lock IDs and their purposes
- [ ] Regular cleanup of orphaned locks (TTL-based)

## Troubleshooting

### Lock Contention
**Symptom**: Jobs frequently fail to acquire locks  
**Solution**: Increase concurrency or reduce job overlap

### Orphaned Locks
**Symptom**: Locks never released, blocking new operations  
**Solution**: Ensure all locks have TTL/timeout

### Deadlocks
**Symptom**: Multiple jobs waiting for each other's locks  
**Solution**: Establish lock ordering, use NOWAIT

## Migration from Single-Instance to Multi-Instance

1. Identify all background jobs and cron tasks
2. Add distributed locking to each job
3. Test with multiple instances in staging
4. Monitor lock metrics in production
5. Gradually roll out to all instances

## References

- PostgreSQL Advisory Locks: https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS
- Redis Distributed Locks: https://redis.io/docs/manual/patterns/distributed-locks/
- Drizzle Transaction Locks: https://orm.drizzle.team/docs/transactions
