# ADR-001: Database Choice (PostgreSQL + Drizzle ORM)

**Status:** Accepted  
**Date:** 2025-10-07  
**Decision Makers:** Development Team  
**Consulted:** DevOps Team, DBA Team  

---

## Context

The EchoVerse Platform requires a robust, scalable database solution to support:
- Multi-tenant architecture with data isolation
- Complex relational data (users, products, orders, communities, posts)
- High transaction volume for e-commerce operations
- ACID compliance for payment processing
- Full-text search capabilities for content
- JSON support for flexible schema needs
- Strong consistency guarantees

We needed to choose both a database system and an ORM that would provide type safety, excellent developer experience, and production-ready performance.

---

## Decision

We have decided to use **PostgreSQL 16** as our primary database with **Drizzle ORM** as the data access layer.

### Key Components:

1. **PostgreSQL 16**
   - Latest stable version with improved performance
   - JSONB support for flexible data structures
   - Full-text search with GIN indexes
   - Row-level security for multi-tenancy
   - Excellent ecosystem and community support

2. **Drizzle ORM**
   - TypeScript-first with full type inference
   - Zero runtime overhead (compiles to SQL)
   - Schema-based migrations with `drizzle-kit`
   - Supports all PostgreSQL features
   - Better performance than Prisma/TypeORM

3. **Connection Pooling**
   - Using `@neondatabase/serverless` for serverless compatibility
   - Connection pool monitoring and metrics
   - Automatic retry logic for transient failures
   - Health checks and circuit breakers

---

## Rationale

### Why PostgreSQL?

**Pros:**
- ✅ ACID compliance for financial transactions
- ✅ Rich data types (JSON, arrays, full-text search)
- ✅ Proven scalability (handles millions of rows)
- ✅ Excellent ecosystem (Neon, Supabase, RDS)
- ✅ Strong consistency model
- ✅ Advanced indexing (B-tree, GIN, GiST, BRIN)
- ✅ Row-level security for multi-tenancy
- ✅ Open source with commercial support

**Cons:**
- ❌ More complex than NoSQL for simple use cases
- ❌ Requires careful index management
- ❌ Vertical scaling has limits

**Alternatives Considered:**
- **MongoDB**: Rejected due to lack of ACID transactions and complex join requirements
- **MySQL**: Rejected due to inferior JSON support and licensing concerns
- **DynamoDB**: Rejected due to vendor lock-in and complex query patterns

### Why Drizzle ORM?

**Pros:**
- ✅ TypeScript-first with excellent type inference
- ✅ Zero runtime overhead (compiles to raw SQL)
- ✅ Schema migrations with `drizzle-kit push`
- ✅ Supports raw SQL when needed
- ✅ Smaller bundle size than alternatives
- ✅ Better performance than Prisma
- ✅ Zod integration for validation

**Cons:**
- ❌ Smaller community than Prisma
- ❌ Fewer ecosystem tools
- ❌ Less mature (though stable)

**Alternatives Considered:**
- **Prisma**: Rejected due to runtime overhead and slower query performance
- **TypeORM**: Rejected due to poor TypeScript support and maintenance concerns
- **Knex.js**: Rejected due to lack of type safety

---

## Implementation Details

### Schema Organization

```typescript
// shared/schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Migration Strategy

- Use `npm run db:push` for schema changes
- `drizzle-kit push` directly updates database
- No manual SQL migrations required
- Force push with `--force` flag for data loss scenarios

### Connection Management

```typescript
// server/db.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Performance Optimizations

1. **Indexes**
   - Unique indexes on email, username
   - Composite indexes for frequent queries
   - GIN indexes for full-text search

2. **Connection Pooling**
   - Max connections: 10 (configurable)
   - Connection timeout: 30s
   - Idle timeout: 10 minutes

3. **Query Optimization**
   - Use `select()` to limit columns
   - Implement pagination for large datasets
   - Use prepared statements (automatic with Drizzle)

---

## Consequences

### Positive

1. **Type Safety**: Full end-to-end type safety from database to API
2. **Performance**: Zero runtime overhead with compiled SQL
3. **Developer Experience**: Excellent IntelliSense and autocomplete
4. **Reliability**: ACID compliance for critical operations
5. **Scalability**: PostgreSQL scales to millions of records
6. **Flexibility**: JSONB support for flexible schemas
7. **Monitoring**: Built-in query performance tracking

### Negative

1. **Learning Curve**: Team needs to learn Drizzle patterns
2. **Migration Complexity**: Schema changes require careful planning
3. **Vendor Lock-in**: Tied to PostgreSQL ecosystem
4. **Cost**: PostgreSQL hosting costs (mitigated by Neon's free tier)

### Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Database downtime | Implement automatic failover with Neon |
| Data loss | Daily automated backups with point-in-time recovery |
| Performance degradation | Query monitoring and slow query alerts |
| Connection pool exhaustion | Circuit breakers and connection limits |
| Schema migration failures | Test migrations in staging first |

---

## Alternatives Considered

### 1. MongoDB + Mongoose
- **Rejected**: Lack of ACID transactions, complex joins
- **When to reconsider**: If schema flexibility becomes primary concern

### 2. MySQL + Prisma
- **Rejected**: Inferior JSON support, Prisma performance overhead
- **When to reconsider**: If team is already familiar with MySQL

### 3. DynamoDB + DocumentClient
- **Rejected**: Vendor lock-in, complex query patterns, higher costs
- **When to reconsider**: If AWS-only deployment is required

---

## Monitoring & Maintenance

### Database Metrics
- Query performance tracking
- Slow query logging (>100ms)
- Connection pool utilization
- Index usage statistics
- Table bloat monitoring

### Maintenance Tasks
- **Daily**: Automated backups
- **Weekly**: VACUUM ANALYZE for performance
- **Monthly**: Index rebuilding if needed
- **Quarterly**: Query performance review

---

## Related Decisions

- [ADR-002: Authentication Strategy](./ADR-002-authentication-strategy.md) - Session storage in PostgreSQL
- [ADR-004: File Storage Strategy](./ADR-004-file-storage-strategy.md) - File metadata in PostgreSQL

---

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Neon Serverless PostgreSQL](https://neon.tech/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Last Updated:** 2025-10-07  
**Next Review:** 2026-04-07
