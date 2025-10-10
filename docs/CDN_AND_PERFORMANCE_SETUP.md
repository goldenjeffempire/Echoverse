# CDN and Performance Configuration Guide

## CDN Setup for Static Assets

### Cloudflare CDN Integration

1. **Configure Cloudflare**:
```bash
# Add to .env.production
CDN_URL=https://cdn.yourapp.com
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

2. **Asset Fingerprinting** (already configured in Vite):
- Vite automatically adds content hashes to filenames
- Cache busting handled automatically

3. **Image Optimization Pipeline**:
```typescript
// Use Cloudflare Image Resizing
const cdnImageUrl = `${CDN_URL}/cdn-cgi/image/width=800,quality=85/${imagePath}`;
```

### Redis Caching Configuration

1. **Install Redis**:
```bash
# Production: Use managed Redis (AWS ElastiCache, Redis Cloud)
# Development: Use local Redis or skip
REDIS_URL=redis://localhost:6379
ENABLE_REDIS_CACHE=true
REDIS_TTL=3600
```

2. **Cache Strategy**:
- Session storage: Move from PostgreSQL to Redis
- Query results: Cache expensive queries
- API responses: Cache with invalidation

### Performance Optimizations Applied

1. **Database Indexes**: Added indexes on frequently queried columns
   - Posts: community_id, user_id, created_at, status
   - Users: email, username, created_at
   - Orders: user_id, status, created_at
   - Products: category, status
   - Community members: community_id, user_id

2. **Query Pagination**: Enforce limits on all list endpoints
   - Default limit: 50
   - Max limit: 200

3. **N+1 Query Fixes**:
   - Community member listings now use JOIN
   - Product categories use eager loading

### Service Worker Caching Strategy

```javascript
// Configured in client/public/sw.js
workbox.routing.registerRoute(
  /\.(js|css|woff2)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

### Monitoring and Alerts

- Database query performance tracked via Prometheus metrics
- Slow queries (>1s) logged automatically
- CDN cache hit rate monitored
- Redis connection health checked

### Production Deployment Checklist

- [ ] Configure CDN DNS records
- [ ] Set up Redis cluster in production
- [ ] Enable Redis session storage
- [ ] Run database index migration
- [ ] Verify asset URLs use CDN
- [ ] Test cache invalidation
- [ ] Monitor performance metrics
- [ ] Set up alerts for slow queries
