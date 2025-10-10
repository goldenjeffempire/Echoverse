# CDN Setup & Static Asset Delivery

This guide explains how to configure external CDN (Content Delivery Network) for the Echoverse platform to optimize static asset delivery globally.

## Overview

The platform supports multiple CDN providers for static asset delivery:
- **CloudFront (AWS)** - Recommended for AWS-hosted applications
- **Fastly** - High-performance edge CDN
- **Cloudflare** - DDoS protection + CDN
- **Azure CDN** - For Azure-hosted applications
- **Custom CDN** - Any CDN supporting origin pull

## Architecture

```
User Request → CDN Edge → Origin Server (cache miss) → Application
           ↓ (cache hit)
     Cached Response
```

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
# CDN Configuration
CDN_URL=https://cdn.yourdomain.com
CDN_ENABLED=true
STATIC_ASSET_VERSION=v1

# Optional: S3 for origin storage
AWS_S3_BUCKET=your-static-assets-bucket
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=your-access-key
AWS_S3_SECRET_ACCESS_KEY=your-secret-key
```

### 2. CloudFront Setup (AWS)

#### Step 1: Create S3 Bucket for Static Assets

```bash
# Create S3 bucket
aws s3 mb s3://echoverse-static-assets --region us-east-1

# Enable static website hosting
aws s3 website s3://echoverse-static-assets \
  --index-document index.html \
  --error-document error.html

# Set bucket policy for public read
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::echoverse-static-assets/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket echoverse-static-assets \
  --policy file://bucket-policy.json
```

#### Step 2: Create CloudFront Distribution

```bash
# Create distribution configuration
cat > cloudfront-config.json << EOF
{
  "CallerReference": "echoverse-$(date +%s)",
  "Comment": "Echoverse Static Assets CDN",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-echoverse-static-assets",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-echoverse-static-assets",
        "DomainName": "echoverse-static-assets.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
EOF

# Create distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### Step 3: Configure Custom Domain (Optional)

```bash
# Add CNAME record in your DNS
# cdn.yourdomain.com → d111111abcdef8.cloudfront.net

# Request SSL certificate from ACM
aws acm request-certificate \
  --domain-name cdn.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# Update CloudFront distribution with custom domain
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --distribution-config file://cloudfront-config-with-ssl.json
```

### 3. Fastly Setup

#### Step 1: Create Fastly Service

```bash
# Install Fastly CLI
brew install fastly

# Create service
fastly service create --name "Echoverse CDN"

# Add backend (origin server)
fastly backend create \
  --service-id YOUR_SERVICE_ID \
  --version 1 \
  --name origin \
  --address your-origin-server.com \
  --port 443 \
  --ssl-hostname your-origin-server.com

# Activate service
fastly service-version activate \
  --service-id YOUR_SERVICE_ID \
  --version 1
```

#### Step 2: Configure VCL (Varnish Configuration Language)

```vcl
# custom-fastly.vcl
sub vcl_recv {
  # Force SSL
  if (!req.http.Fastly-SSL) {
    error 801 "Force SSL";
  }
  
  # Set cache key
  set req.http.X-Cache-Key = req.url;
}

sub vcl_fetch {
  # Cache static assets for 1 year
  if (beresp.http.Content-Type ~ "^(image|text/css|application/javascript)") {
    set beresp.ttl = 365d;
    set beresp.http.Cache-Control = "public, max-age=31536000";
  }
  
  # Add version header
  set beresp.http.X-Asset-Version = "v1";
}
```

### 4. Cloudflare Setup

#### Step 1: Add Site to Cloudflare

1. Go to Cloudflare Dashboard
2. Add your domain
3. Update nameservers at your registrar

#### Step 2: Configure Page Rules

```
# Rule 1: Cache static assets
URL Pattern: cdn.yourdomain.com/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year

# Rule 2: Always use HTTPS
URL Pattern: http://cdn.yourdomain.com/*
Settings:
  - Always Use HTTPS: On
```

#### Step 3: Configure Workers (Optional)

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Add version parameter
  const cache = caches.default
  const cacheKey = new Request(url.toString() + '?v=1', request)
  
  let response = await cache.match(cacheKey)
  
  if (!response) {
    response = await fetch(request)
    event.waitUntil(cache.put(cacheKey, response.clone()))
  }
  
  return response
}
```

## Cache Invalidation

### CloudFront

```bash
# Invalidate all assets
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/assets/*" "/images/*"
```

### Fastly

```bash
# Purge all
fastly purge-all --service-id YOUR_SERVICE_ID

# Purge specific URL
fastly purge https://cdn.yourdomain.com/asset.js
```

### Cloudflare

```bash
# Using API
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "X-Auth-Email: your-email@example.com" \
  -H "X-Auth-Key: your-api-key" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Asset Upload Automation

### Upload Script

```bash
#!/bin/bash
# upload-to-cdn.sh

# Build assets
npm run build

# Sync to S3
aws s3 sync ./dist/assets s3://echoverse-static-assets/assets \
  --cache-control "public, max-age=31536000" \
  --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/assets/*"

echo "Assets uploaded and CDN invalidated successfully"
```

### GitHub Actions Integration

```yaml
# .github/workflows/deploy-assets.yml
name: Deploy Assets to CDN

on:
  push:
    branches: [main]
    paths:
      - 'client/src/**'
      - 'client/public/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build assets
        run: npm run build
      
      - name: Upload to S3
        run: |
          aws s3 sync ./dist/assets s3://echoverse-static-assets/assets \
            --cache-control "public, max-age=31536000" \
            --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/assets/*"
```

## Performance Optimization

### 1. Image Optimization

```javascript
// server/utils/cdn-helper.ts
export function getCDNUrl(path: string): string {
  const cdnEnabled = process.env.CDN_ENABLED === 'true';
  const cdnUrl = process.env.CDN_URL;
  const assetVersion = process.env.STATIC_ASSET_VERSION || 'v1';
  
  if (cdnEnabled && cdnUrl) {
    return `${cdnUrl}/${assetVersion}${path}`;
  }
  
  return path;
}

// Usage
const imageUrl = getCDNUrl('/images/logo.png');
// Returns: https://cdn.yourdomain.com/v1/images/logo.png
```

### 2. Asset Versioning

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js'
      }
    }
  }
});
```

### 3. Compression

All CDN providers support automatic compression (Gzip/Brotli). Ensure it's enabled:

- **CloudFront**: Set `Compress: true` in distribution settings
- **Fastly**: Compression enabled by default
- **Cloudflare**: Auto-compress enabled in dashboard

## Monitoring

### CloudFront Metrics

```bash
# View cache statistics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=YOUR_DISTRIBUTION_ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Fastly Metrics

```bash
# Get service stats
fastly stats historical \
  --service-id YOUR_SERVICE_ID \
  --from "2024-01-01" \
  --to "2024-01-31"
```

## Troubleshooting

### Issue: Assets Not Loading from CDN

**Solution:**
1. Check CDN_ENABLED=true in .env
2. Verify CDN_URL is correct
3. Check CORS headers on origin server
4. Verify SSL certificate is valid

### Issue: Outdated Assets Served

**Solution:**
1. Invalidate CDN cache
2. Update STATIC_ASSET_VERSION
3. Check cache headers

### Issue: High Costs

**Solution:**
1. Review cache hit ratio
2. Optimize asset sizes
3. Consider cheaper CDN tier
4. Implement edge caching rules

## Best Practices

1. **Always use HTTPS** for CDN domains
2. **Set proper cache headers** for different asset types
3. **Use asset versioning** to prevent stale content
4. **Monitor CDN costs** and optimize regularly
5. **Implement automatic invalidation** in CI/CD pipeline
6. **Use multiple CDN locations** for global coverage
7. **Enable compression** for all text-based assets
8. **Set long TTLs** for immutable assets

## Cost Optimization

- Use CloudFront's price classes to limit edge locations
- Implement origin shield to reduce origin requests
- Use S3 Intelligent-Tiering for storage
- Monitor and set up alerts for unusual traffic
