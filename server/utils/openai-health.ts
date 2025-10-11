/**
 * OpenAI Health Check - PHASE 5.5
 * 
 * Verifies OpenAI API connectivity and measures latency
 */

import { logger } from '../logger';
import { config } from '../config';

interface OpenAIHealthResult {
  healthy: boolean;
  latency: number;
  error?: string;
}

export async function checkOpenAIHealth(): Promise<OpenAIHealthResult> {
  const startTime = Date.now();

  try {
    // Only check if OpenAI is configured
    if (!config.openaiApiKey) {
      return {
        healthy: true, // Not configured is not unhealthy
        latency: 0,
        error: 'OpenAI not configured'
      };
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    // Test OpenAI connection by listing models (lightweight operation)
    const models = await openai.models.list();
    // Just check if we can access the list, don't need to iterate
    const firstModel = models.data[0];
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('OpenAI health check failed', error instanceof Error ? error : undefined, {
      latency,
      error: errorMessage
    });
    
    return {
      healthy: false,
      latency,
      error: errorMessage
    };
  }
}
