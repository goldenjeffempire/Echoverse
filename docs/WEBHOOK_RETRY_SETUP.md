# Webhook Retry Processor Setup

## Overview
The webhook retry processor automatically retries failed webhook deliveries with exponential backoff to ensure reliable event delivery to external systems.

## ISSUE #19 FIX: Automatic Webhook Retry Processor Startup

The webhook retry processor is implemented in `server/services/webhook-retry-processor.ts` and provides automatic retry functionality for failed webhooks.

## Configuration

### Default Configuration
```typescript
{
  maxAttempts: 3,              // Maximum retry attempts before DLQ
  initialBackoffSeconds: 60,    // 1 minute initial delay
  maxBackoffSeconds: 3600,      // 1 hour maximum delay
  backoffMultiplier: 2          // Exponential backoff (60s, 120s, 240s)
}
```

## Starting the Processor

### In Production
The webhook retry processor should be started automatically on server startup:

```typescript
// In server/index.ts or background jobs setup
import { WebhookRetryProcessor } from './services/webhook-retry-processor';

// Initialize processor
const webhookRetryProcessor = new WebhookRetryProcessor();

// Start with 30-second interval (processes retries every 30 seconds)
webhookRetryProcessor.start(30000);

// Register cleanup on shutdown
process.on('SIGTERM', () => {
  webhookRetryProcessor.stop();
});
```

### Current Status
Currently, background jobs are temporarily disabled (see `server/index.ts` line 437) due to database connection pool issues. Once the pool issues are resolved, uncomment the webhook retry processor initialization.

## Features

### Exponential Backoff
- Attempt 1: 60 seconds
- Attempt 2: 120 seconds  
- Attempt 3: 240 seconds
- After 3 attempts: Moved to Dead Letter Queue (DLQ)

### Poison Message Handling
Messages that repeatedly fail are automatically detected and moved to DLQ to prevent infinite loops.

### Monitoring
The processor logs all retry attempts and failures for observability:
- `INFO`: Retry processing started
- `WARN`: Poison message detected
- `ERROR`: Webhook permanently failed after max retries

## Database Schema
Webhook retries are stored in the `webhook_retries` table with the following fields:
- `id`: Unique retry identifier
- `webhookEventId`: Reference to original webhook event
- `attempt`: Current attempt number
- `maxAttempts`: Maximum attempts before DLQ
- `nextRetryAt`: When to retry next
- `backoffSeconds`: Current backoff duration
- `status`: pending | processing | completed | failed
- `lastError`: Last error message
- `lastStatusCode`: Last HTTP status code

## Manual Operations

### Manually Trigger Retry Processing
```typescript
import { webhookRetryProcessor } from './server/services/webhook-retry-processor';

await webhookRetryProcessor.processRetries();
```

### Query Pending Retries
```typescript
import { storage } from './server/storage';

const pendingRetries = await storage.getWebhookRetriesToProcess(50);
console.log(`${pendingRetries.length} webhooks pending retry`);
```

## Production Checklist
- [ ] Ensure `WEBHOOK_MAX_RETRIES` env var is set (default: 3)
- [ ] Ensure `WEBHOOK_RETRY_DELAY` env var is set (default: 1000ms)
- [ ] Ensure `WEBHOOK_TIMEOUT` env var is set (default: 30000ms)
- [ ] Start webhook retry processor on server startup
- [ ] Monitor webhook retry metrics in logs
- [ ] Set up alerts for high retry rates
- [ ] Configure DLQ handling for permanently failed webhooks

## Troubleshooting

### Processor Not Running
Check that background jobs are enabled in `server/index.ts`. Currently they are temporarily disabled.

### High Retry Rates
- Check webhook endpoint availability
- Verify network connectivity
- Review webhook payload validity
- Check for rate limiting on destination

### Database Connection Issues
If retries are causing database pool exhaustion:
- Reduce processing interval (increase time between checks)
- Reduce batch size in `getWebhookRetriesToProcess`
- Increase database connection pool size
