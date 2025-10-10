# File Storage Migration to Cloud

## Overview

Migrate from local file storage to cloud storage (AWS S3, Google Cloud Storage, or Azure Blob) for production deployment.

## AWS S3 Setup (Recommended)

### 1. Create S3 Bucket

```bash
# Install AWS CLI
aws configure

# Create bucket
aws s3 mb s3://echoverse-uploads --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket echoverse-uploads \
  --versioning-configuration Status=Enabled

# Configure lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket echoverse-uploads \
  --lifecycle-configuration file://s3-lifecycle.json
```

### 2. S3 Lifecycle Configuration

Create `s3-lifecycle.json`:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "Id": "TransitionToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### 3. Configure IAM User

```bash
# Create IAM user for app
aws iam create-user --user-name echoverse-app

# Attach S3 policy
aws iam attach-user-policy \
  --user-name echoverse-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name echoverse-app
```

### 4. Update Environment Variables

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=echoverse-uploads
AWS_REGION=us-east-1
USE_CLOUD_STORAGE=true
```

### 5. Enable CDN Integration

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name echoverse-uploads.s3.amazonaws.com \
  --default-cache-behavior file://cloudfront-config.json

# Update CDN_URL in environment
CDN_URL=https://d123456.cloudfront.net
```

## ClamAV Virus Scanning

### Docker Setup (Included in docker-compose.yml)

```yaml
clamav:
  image: clamav/clamav:latest
  container_name: echoverse-clamav
  restart: unless-stopped
  ports:
    - "3310:3310"
  volumes:
    - clamav_data:/var/lib/clamav
```

### Configuration

```bash
# Environment variables
CLAMAV_HOST=clamav  # or IP address
CLAMAV_PORT=3310
ENABLE_VIRUS_SCAN=true
VIRUS_SCAN_FALLBACK=quarantine  # Options: reject, quarantine, allow
```

### Fallback Strategy

1. **Primary**: ClamAV scans all uploads
2. **Fallback**: If ClamAV unavailable:
   - `reject`: Reject upload (safest)
   - `quarantine`: Accept but flag for review
   - `allow`: Accept without scan (not recommended)

## File Backup Strategy

### Automated Backups

```bash
# Daily backup to separate bucket
aws s3 sync s3://echoverse-uploads s3://echoverse-backups \
  --storage-class GLACIER_IR \
  --delete

# Schedule via cron (daily at 3 AM)
0 3 * * * /usr/local/bin/backup-s3.sh
```

### Backup Script

Create `/usr/local/bin/backup-s3.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
aws s3 sync s3://echoverse-uploads s3://echoverse-backups/$DATE \
  --storage-class GLACIER_IR
echo "Backup completed: $DATE"
```

### Restore Procedure

```bash
# List backups
aws s3 ls s3://echoverse-backups/

# Restore from specific date
aws s3 sync s3://echoverse-backups/2024-01-15 s3://echoverse-uploads

# Restore single file
aws s3 cp s3://echoverse-backups/2024-01-15/path/to/file.jpg \
  s3://echoverse-uploads/path/to/file.jpg
```

## Migration Steps

### Step 1: Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

### Step 2: Create Storage Adapter

File already exists at `server/utils/storage-adapter.ts` - update config:

```typescript
// Enable S3 in production
const useS3 = process.env.USE_CLOUD_STORAGE === 'true';
```

### Step 3: Migrate Existing Files

```bash
# Sync local uploads to S3
aws s3 sync ./uploads s3://echoverse-uploads/uploads \
  --acl private \
  --metadata-directive REPLACE

# Verify sync
aws s3 ls s3://echoverse-uploads/uploads --recursive | wc -l
```

### Step 4: Update Application

```bash
# Set environment variable
export USE_CLOUD_STORAGE=true

# Restart application
kubectl rollout restart deployment/echoverse-app -n production
```

### Step 5: Verify Migration

```bash
# Upload test file
curl -X POST https://yourdomain.com/api/upload \
  -H "Authorization: Bearer token" \
  -F "file=@test.jpg"

# Verify in S3
aws s3 ls s3://echoverse-uploads/uploads/
```

## Google Cloud Storage Alternative

### Setup

```bash
# Install Google Cloud SDK
gcloud init

# Create bucket
gsutil mb -l us-east1 gs://echoverse-uploads

# Enable versioning
gsutil versioning set on gs://echoverse-uploads

# Create service account
gcloud iam service-accounts create echoverse-app

# Grant permissions
gsutil iam ch serviceAccount:echoverse-app@project.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://echoverse-uploads

# Download credentials
gcloud iam service-accounts keys create gcs-credentials.json \
  --iam-account echoverse-app@project.iam.gserviceaccount.com
```

### Environment Configuration

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-credentials.json
GCS_BUCKET=echoverse-uploads
USE_CLOUD_STORAGE=true
STORAGE_PROVIDER=gcs
```

## Azure Blob Storage Alternative

### Setup

```bash
# Install Azure CLI
az login

# Create storage account
az storage account create \
  --name echoversestorage \
  --resource-group echoverse \
  --location eastus \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \
  --name echoversestorage \
  --resource-group echoverse

# Create container
az storage container create \
  --name uploads \
  --account-name echoversestorage
```

### Environment Configuration

```bash
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER=uploads
USE_CLOUD_STORAGE=true
STORAGE_PROVIDER=azure
```

## Performance Optimization

### 1. Enable Transfer Acceleration (S3)

```bash
aws s3api put-bucket-accelerate-configuration \
  --bucket echoverse-uploads \
  --accelerate-configuration Status=Enabled
```

### 2. Use CDN for Downloads

```bash
# All file URLs use CDN
https://cdn.yourdomain.com/uploads/file.jpg

# Instead of direct S3
https://echoverse-uploads.s3.amazonaws.com/uploads/file.jpg
```

### 3. Implement Multipart Upload

For files > 5MB, use multipart upload (already implemented in storage-adapter).

### 4. Enable Compression

```typescript
// Compress images before upload
import sharp from 'sharp';

await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside' })
  .webp({ quality: 85 })
  .toBuffer();
```

## Security Best Practices

### 1. Bucket Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::echoverse-uploads/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### 2. Encryption at Rest

```bash
# Enable default encryption
aws s3api put-bucket-encryption \
  --bucket echoverse-uploads \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3. Access Logging

```bash
# Enable access logging
aws s3api put-bucket-logging \
  --bucket echoverse-uploads \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "echoverse-logs",
      "TargetPrefix": "s3-access-logs/"
    }
  }'
```

## Monitoring & Alerts

### CloudWatch Metrics (S3)

- Storage size
- Number of objects
- Request count
- Error rate
- Download bandwidth

### Alerts

```bash
# Create SNS topic
aws sns create-topic --name echoverse-storage-alerts

# Subscribe to alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:echoverse-storage-alerts \
  --protocol email \
  --notification-endpoint ops@yourdomain.com

# Create CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-storage-usage \
  --alarm-description "Alert when storage exceeds 1TB" \
  --metric-name BucketSizeBytes \
  --namespace AWS/S3 \
  --statistic Average \
  --period 86400 \
  --threshold 1099511627776 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:echoverse-storage-alerts
```

## Cost Optimization

### 1. Storage Classes

- **Standard**: Frequently accessed files
- **Intelligent-Tiering**: Unknown access patterns
- **Glacier**: Archive/backup

### 2. Lifecycle Policies

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldUploads",
      "Filter": { "Prefix": "uploads/" },
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "INTELLIGENT_TIERING"
        }
      ]
    }
  ]
}
```

### 3. Delete Unused Files

```bash
# List files not accessed in 180 days
aws s3api list-objects-v2 \
  --bucket echoverse-uploads \
  --query 'Contents[?LastModified<`2023-07-01`]'
```

## Testing Checklist

- [ ] Upload file to cloud storage
- [ ] Download file from CDN
- [ ] Virus scan active and working
- [ ] Backup running automatically
- [ ] Encryption at rest verified
- [ ] Access logs being written
- [ ] Lifecycle policies active
- [ ] Cost alerts configured
- [ ] Disaster recovery tested
