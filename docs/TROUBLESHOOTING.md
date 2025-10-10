# Troubleshooting Guide

## Common Issues & Solutions

### Database Connection Errors

**Issue**: `DATABASE_URL must be set`
```bash
# Solution: Verify environment variable
echo $DATABASE_URL
# If empty, provision database in Replit
```

**Issue**: `Connection pool exhausted`
```bash
# Solution: Check pool stats
curl http://localhost:5000/api/health
# Increase pool size if needed
export DB_POOL_MAX=50
```

### Build & Deployment Issues

**Issue**: `Cannot find module 'drizzle-orm'`
```bash
# Solution: Clean reinstall
rm -rf node_modules
npm install
```

**Issue**: TypeScript errors
```bash
# Solution: Check types
npm run typecheck
```

### WebSocket Connection Issues

**Issue**: `[vite] failed to connect to websocket`
- **Cause**: HMR configuration for Replit proxy
- **Solution**: Already fixed in vite.config.ts (uses REPLIT_DOMAINS)

**Issue**: WebSocket disconnects frequently
```bash
# Check WebSocket health
curl http://localhost:5000/api/health
# Look for "websocket" status
```

### Authentication Issues

**Issue**: `Invalid CSRF token`
```bash
# Solution: Clear cookies and retry
# Or call /api/csrf-token first
curl http://localhost:5000/api/csrf-token
```

**Issue**: Session expires immediately
- Check SESSION_SECRET is set
- Verify session cookie settings
- Check server logs for session errors

### AI Provider Issues

**Issue**: `AI provider unavailable`
```bash
# Check provider health
curl http://localhost:5000/api/health | jq '.openai'
# Verify OPENAI_API_KEY is set
```

**Issue**: Circuit breaker open
- Wait for cooldown period (60s default)
- Check provider endpoint health
- Review circuit breaker logs

### Performance Issues

**Issue**: Slow database queries
```bash
# Check query metrics
curl http://localhost:5000/api/admin/query-metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Issue**: High memory usage
- Check connection pool size
- Review slow query logs
- Monitor with `npm run test:coverage`

### File Upload Issues

**Issue**: Upload fails with 413 error
- Check file size limits (default 100MB)
- Verify UPLOAD_MAX_SIZE env var

**Issue**: Virus scan fails
- Check ClamAV service status
- Review quarantine directory logs

## Debug Mode

Enable detailed logging:
```bash
export NODE_ENV=development
export DEBUG=app:*
npm run dev
```

## Getting Help

1. Check logs: `tail -f logs/*.log`
2. Review [MONITORING_RUNBOOK.md](../MONITORING_RUNBOOK.md)
3. Check GitHub issues
4. Contact support with error logs
