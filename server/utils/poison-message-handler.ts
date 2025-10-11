import { logger } from '../logger';

interface PoisonMessage {
  id: string;
  payload: any;
  attempts: number;
  lastError: string;
  firstFailedAt: Date;
  lastFailedAt: Date;
}

// Store for poison messages (in production, use database)
const poisonMessages = new Map<string, PoisonMessage>();
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Handle poison messages in webhook retry processor
 * Moves messages that repeatedly fail to a dead letter queue
 */
export function handlePoisonMessage(
  messageId: string,
  payload: any,
  error: Error,
  attemptNumber: number
): { shouldRetry: boolean; isPoisoned: boolean } {
  const existing = poisonMessages.get(messageId);

  if (attemptNumber >= MAX_RETRY_ATTEMPTS) {
    // Mark as poison message
    const poisonMessage: PoisonMessage = {
      id: messageId,
      payload,
      attempts: attemptNumber,
      lastError: error.message,
      firstFailedAt: existing?.firstFailedAt || new Date(),
      lastFailedAt: new Date(),
    };

    poisonMessages.set(messageId, poisonMessage);

    logger.error('Poison message detected - moved to dead letter queue', error, {
      messageId,
      attempts: attemptNumber,
      firstFailedAt: poisonMessage.firstFailedAt,
    });

    return { shouldRetry: false, isPoisoned: true };
  }

  // Update tracking
  if (existing) {
    existing.attempts = attemptNumber;
    existing.lastError = error.message;
    existing.lastFailedAt = new Date();
  } else {
    poisonMessages.set(messageId, {
      id: messageId,
      payload,
      attempts: attemptNumber,
      lastError: error.message,
      firstFailedAt: new Date(),
      lastFailedAt: new Date(),
    });
  }

  return { shouldRetry: true, isPoisoned: false };
}

/**
 * Get all poison messages for inspection
 */
export function getPoisonMessages(): PoisonMessage[] {
  return Array.from(poisonMessages.values());
}

/**
 * Retry a poison message manually
 */
export function retryPoisonMessage(messageId: string): boolean {
  const message = poisonMessages.get(messageId);
  if (message) {
    poisonMessages.delete(messageId);
    logger.info('Poison message manually retried', { messageId });
    return true;
  }
  return false;
}

/**
 * Clear poison messages older than specified days
 */
export function cleanupPoisonMessages(retentionDays: number = 7): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let cleaned = 0;
  for (const [id, message] of poisonMessages.entries()) {
    if (message.lastFailedAt < cutoffDate) {
      poisonMessages.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info('Cleaned up old poison messages', { count: cleaned });
  }

  return cleaned;
}
