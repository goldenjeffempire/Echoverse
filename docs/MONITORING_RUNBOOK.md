# MED-012 FIX: Monitoring & Incident Response Runbook

## 🚨 Alert Response Procedures

### Critical Alerts (P0 - Immediate Response)

#### 1. Database Connection Pool Exhausted
**Alert**: `db_connection_pool_utilization > 90%`

**Symptoms**:
- 503 Service Unavailable errors
- Slow API responses
- Circuit breaker OPEN state

**Immediate Actions**:
1. Check current pool stats: `GET /api/admin/db-stats`
2. Identify long-running queries: `GET /api/admin/query-metrics`
3. Kill blocking queries if found
4. Scale up DB_POOL_MAX temporarily (restart required)

**Escalation**: If issue persists >10 min, page on-call DBA

---

#### 2. Circuit Breaker Opened
**Alert**: `circuit_breaker_state = OPEN`

**Immediate Actions**:
1. Check metrics: `GET /metrics` (filter: circuit_breaker)
2. Review error logs for root cause
3. Verify database connectivity
4. If DB is healthy, manually reset circuit breaker (requires deployment)

**Recovery Time**: Circuit breaker auto-recovers after 60s (configurable)

---

#### 3. High Error Rate
**Alert**: `http_error_rate_5xx > 5%`

**Investigation Steps**:
1. Check error logs: `/tmp/logs/` or Sentry dashboard
2. Identify error pattern (specific endpoint, time-based, etc.)
3. Check recent deployments (rollback if needed)
4. Verify external dependencies (Stripe, OpenAI, etc.)

**Rollback Command**:
```bash
# Revert to previous version
kubectl rollout undo deployment/echoverse-api -n production
```

---

### High Priority Alerts (P1 - Response within 15 min)

#### 4. Backup Verification Failed
**Alert**: `backup_verification_failed = 1`

**Actions**:
1. Check backup logs: `cat /tmp/logs/backup*.log`
2. Verify backup exists in S3: `aws s3 ls s3://echoverse-prod-backups/`
3. Attempt manual verification: `npm run backup:verify`
4. If verification fails, trigger immediate backup: `npm run backup:create`

---

#### 5. Replica Lag High
**Alert**: `db_replica_lag_seconds > 60`

**Actions**:
1. Check replica health: `GET /api/admin/replica-health`
2. Verify network connectivity to replica
3. Temporarily disable replica reads if lag critical
4. Alert DBA team for investigation

**Fallback**:
```typescript
// Disable replica reads temporarily
process.env.ENABLE_READ_REPLICAS = 'false'
// Restart required
```

---

#### 6. Memory Usage High
**Alert**: `nodejs_heap_used_bytes / nodejs_heap_size_limit_bytes > 0.9`

**Actions**:
1. Check metrics: `GET /api/admin/memory-metrics`
2. Identify memory leaks using heap snapshot
3. Force garbage collection: `kill -SIGUSR2 <pid>`
4. Scale horizontally if needed
5. Restart pod if memory not released

---

### Medium Priority Alerts (P2 - Response within 1 hour)

#### 7. Disk Usage High
**Alert**: `disk_usage_percent > 85%`

**Actions**:
1. Identify large files: `du -sh /app/* | sort -rh | head -10`
2. Clean old logs: `find /tmp/logs -mtime +7 -delete`
3. Clean quarantined files: `rm -rf /app/quarantine/*`
4. Review upload storage usage

---

#### 8. SSL Certificate Expiring
**Alert**: `ssl_cert_expires_days < 30`

**Actions**:
1. Verify cert expiration: `openssl x509 -in /etc/ssl/certs/echoverse.crt -noout -dates`
2. Trigger manual renewal: `certbot renew --force-renewal`
3. Verify auto-renewal is configured
4. Update cert in Kubernetes secrets

---

## 📊 Metrics Dashboard Access

- **Prometheus**: http://prometheus.echoverse.internal:9090
- **Grafana**: http://grafana.echoverse.internal:3000
- **Sentry**: https://sentry.io/organizations/echoverse/
- **Application Metrics**: GET /metrics (requires API key)

## 🔧 Common Troubleshooting Commands

```bash
# Check application health
curl http://localhost:5000/api/health

# View real-time logs
kubectl logs -f deployment/echoverse-api -n production

# Check pod status
kubectl get pods -n production

# Describe pod for events
kubectl describe pod <pod-name> -n production

# Execute commands in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# View circuit breaker state
curl -H "x-api-key: $ADMIN_API_KEY" http://localhost:5000/api/admin/circuit-breaker
```

## 📞 Escalation Paths

### Level 1: On-Call Engineer (You)
- All alerts initially go here
- Handle P2-P0 alerts
- Escalate if unable to resolve within SLA

### Level 2: Team Lead
- **Escalate if**: Issue not resolved in 30 min (P0), 1 hour (P1)
- **Contact**: Slack @team-lead or phone: +1-XXX-XXX-XXXX

### Level 3: Engineering Manager
- **Escalate if**: Major outage affecting >50% users
- **Contact**: Slack @eng-manager or phone: +1-XXX-XXX-XXXX

### Level 4: CTO
- **Escalate if**: Data breach, security incident, or complete system failure
- **Contact**: Immediate page via PagerDuty

## 🎯 Performance Baselines

| Metric | P50 | P95 | P99 | Alert Threshold |
|--------|-----|-----|-----|-----------------|
| API Response Time | <100ms | <500ms | <1s | >2s |
| Database Query Time | <10ms | <50ms | <100ms | >500ms |
| Error Rate | <0.1% | <0.5% | <1% | >5% |
| CPU Usage | <40% | <70% | <85% | >90% |
| Memory Usage | <50% | <75% | <85% | >90% |

## 📝 Post-Incident Checklist

After resolving any P0/P1 incident:

1. ✅ Document incident in post-mortem template
2. ✅ Update runbook with new learnings
3. ✅ Create JIRA tickets for preventive measures
4. ✅ Schedule blameless post-mortem meeting
5. ✅ Update monitoring/alerting if needed
6. ✅ Communicate resolution to stakeholders

---

**Last Updated**: 2025-10-10  
**Maintained By**: Platform Engineering Team
