# Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Kubernetes cluster (GKE, EKS, or AKS)
- kubectl configured
- Domain name and SSL certificates
- Required secrets configured

## Environment Configuration

### Required Secrets

Create a `.env.production` file with:

```bash
# Security (CRITICAL - Must be 64+ chars with 3+ character types)
JWT_SECRET=your-jwt-secret-64-chars-minimum
SESSION_SECRET=your-session-secret-64-chars-minimum
FILE_ENCRYPTION_KEY=your-hex-key-64-characters
WEBHOOK_SIGNATURE_SECRET=your-webhook-secret-64-chars
TWO_FACTOR_BACKUP_ENCRYPTION_KEY=your-2fa-key-32-chars

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (Optional but recommended)
REDIS_URL=redis://host:6379
ENABLE_REDIS_CACHE=true

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Provider
OPENAI_API_KEY=sk-...

# File Storage (S3/Cloud)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=us-east-1

# CDN
CDN_URL=https://cdn.yourdomain.com

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# Monitoring
SENTRY_DSN=... (optional)
```

## Deployment Options

### Option 1: Docker Compose (Simple)

```bash
# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:push

# Check logs
docker-compose logs -f app

# Scale services
docker-compose up -d --scale app=3
```

### Option 2: Kubernetes (Production)

#### Step 1: Create Namespace
```bash
kubectl create namespace production
```

#### Step 2: Create Secrets
```bash
kubectl create secret generic echoverse-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=session-secret="..." \
  --from-literal=jwt-secret="..." \
  --from-literal=file-encryption-key="..." \
  --from-literal=stripe-secret-key="..." \
  --from-literal=stripe-webhook-secret="..." \
  --from-literal=openai-api-key="..." \
  -n production
```

#### Step 3: Deploy Application
```bash
# Apply all configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n production
kubectl get svc -n production

# Check logs
kubectl logs -f deployment/echoverse-app -n production
```

#### Step 4: Run Migrations
```bash
kubectl exec -n production deployment/echoverse-app -- npm run db:push
```

#### Step 5: Configure Ingress (Optional)
```bash
kubectl apply -f k8s/ingress.yaml
```

### Option 3: CI/CD Automated Deployment

The application includes automated CI/CD pipeline (`.github/workflows/production-deploy.yml`) that:

1. Runs security scanning (Trivy)
2. Runs tests (integration + E2E)
3. Builds Docker image
4. Deploys to Kubernetes
5. Auto-rollback on failure

**Setup:**
```bash
# Add secrets to GitHub repository:
- KUBE_CONFIG (Kubernetes config)
- SLACK_WEBHOOK (for notifications)
```

## Post-Deployment Tasks

### 1. Database Setup
```bash
# Apply performance indexes
npm run db:push --force

# Verify migrations
npm run db:check
```

### 2. Health Checks
```bash
# Application health
curl https://yourdomain.com/api/health

# Metrics endpoint
curl https://yourdomain.com/metrics

# WebSocket health
curl https://yourdomain.com/api/ws/health
```

### 3. Monitoring Setup

#### Prometheus
```bash
kubectl apply -f k8s/prometheus-config.yaml
```

#### Grafana
```bash
kubectl apply -f k8s/grafana-provisioning.yaml
```

Access dashboards:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

### 4. CDN Configuration

1. Upload static assets to CDN
2. Configure CDN headers:
   ```
   Cache-Control: public, max-age=31536000, immutable
   ```
3. Update `CDN_URL` environment variable

### 5. SSL/TLS Setup

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create certificate
kubectl apply -f k8s/certificate.yaml
```

## Scaling

### Horizontal Scaling
```bash
# Manual scaling
kubectl scale deployment echoverse-app --replicas=5 -n production

# Auto-scaling is configured via HPA (3-10 replicas)
kubectl get hpa -n production
```

### Vertical Scaling
Edit `k8s/deployment.yaml` and update resource limits:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "4000m"
```

## Backup & Recovery

### Database Backups
```bash
# Automated daily backups at 2 AM (configured in app)
# Manual backup:
kubectl exec -n production deployment/echoverse-app -- npm run db:backup

# Restore from backup:
kubectl exec -n production deployment/echoverse-app -- npm run db:restore backup-file.sql
```

### File Storage Backups
- Configure S3 versioning
- Enable automated backups
- Test restore procedures monthly

## Monitoring & Alerts

### Key Metrics to Monitor
- Response time (p95, p99)
- Error rate
- Database connection pool utilization
- WebSocket connection count
- AI provider health
- Slow queries (>1s)

### Alert Conditions
- Error rate > 5%
- Response time p99 > 2s
- Database pool > 80%
- Circuit breaker trips > 10/min
- Failed AI provider health checks

## Rollback Procedures

### Automated Rollback
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/echoverse-app -n production

# Rollback to specific revision
kubectl rollout undo deployment/echoverse-app --to-revision=2 -n production

# Check rollout history
kubectl rollout history deployment/echoverse-app -n production
```

### Database Rollback
```bash
# Revert migration (if needed)
kubectl exec -n production deployment/echoverse-app -- npm run db:rollback

# Restore from backup
kubectl exec -n production deployment/echoverse-app -- npm run db:restore latest
```

## Troubleshooting

### Common Issues

**Pod not starting:**
```bash
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production
```

**Database connection issues:**
```bash
# Check database health
kubectl exec -n production deployment/echoverse-app -- curl localhost:5000/api/health

# Check environment variables
kubectl exec -n production deployment/echoverse-app -- env | grep DATABASE
```

**High memory usage:**
```bash
# Check metrics
kubectl top pods -n production

# Restart pods
kubectl rollout restart deployment/echoverse-app -n production
```

## Security Checklist

- [ ] All secrets stored in Kubernetes secrets (not in env files)
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting enabled
- [ ] CSRF protection active
- [ ] Helmet security headers configured
- [ ] Database connections encrypted
- [ ] File encryption keys rotated
- [ ] Backup encryption verified
- [ ] Network policies applied
- [ ] Pod security policies enforced

## Performance Optimization

### Database
- [ ] Indexes applied (run migration 002)
- [ ] Connection pooling configured (auto-scaling)
- [ ] Slow query monitoring active
- [ ] Read replicas configured (optional)

### Caching
- [ ] Redis cache enabled
- [ ] CDN configured for static assets
- [ ] Service worker active
- [ ] Browser caching headers set

### Application
- [ ] Horizontal auto-scaling configured (HPA)
- [ ] Resource limits optimized
- [ ] Graceful shutdown enabled
- [ ] Health checks configured

## Maintenance Windows

Schedule regular maintenance:
- Database backups: Daily at 2 AM
- Log rotation: Weekly
- Certificate renewal: Auto (Let's Encrypt)
- Dependency updates: Monthly
- Security patches: As needed

## Support Contacts

- DevOps Team: devops@yourdomain.com
- On-call Engineer: oncall@yourdomain.com
- Incident Management: incidents@yourdomain.com
