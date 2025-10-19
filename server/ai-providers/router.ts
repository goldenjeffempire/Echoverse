import { AIProvider, getAIConfig, ProviderHealth, TokenUsage, AIRequestLog } from './base';
import { TransformersProvider } from './transformers';
import { OpenAIProvider } from './openai';
import { AIServiceError } from '../utils/errors';
import { logger } from '../logger';
import { randomUUID } from 'crypto';
import {
  aiProviderHealth,
  aiProviderConsecutiveFailures,
  aiProviderLatencyMs,
  aiProviderCircuitBreakerState
} from '../monitoring/metrics';
import { TIME_CONSTANTS, AI_CONFIG } from '@shared/constants';

interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  state: 'closed' | 'open' | 'half-open';
  openUntil: Date | null;
}

class AIProviderRouter {
  private primaryProvider: AIProvider;
  private fallbackProvider: AIProvider | null;
  private config;
  private primaryHealth: ProviderHealth;
  private fallbackHealth: ProviderHealth | null;
  private circuitBreaker: CircuitBreakerState;
  private requestLogs: AIRequestLog[] = [];
  private maxLogSize = 100;
  private alertSent: boolean = false;
  private lastAlertTime: Date | null = null;
  
  // Configurable thresholds from environment or defaults
  private readonly CONSECUTIVE_FAILURE_THRESHOLD = parseInt(process.env.AI_PROVIDER_FAILURE_THRESHOLD ?? '5', 10);
  private readonly COOLDOWN_PERIOD_MS = parseInt(process.env.AI_PROVIDER_COOLDOWN_MS ?? String(5 * TIME_CONSTANTS.ONE_MINUTE), 10);
  private readonly HEALTH_CHECK_TIMEOUT_MS = parseInt(process.env.AI_PROVIDER_HEALTH_TIMEOUT_MS ?? String(3 * TIME_CONSTANTS.ONE_SECOND), 10);
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = TIME_CONSTANTS.ONE_MINUTE;
  private readonly MAX_RETRIES = AI_CONFIG.MAX_RETRIES;
  private readonly RETRY_DELAYS = [TIME_CONSTANTS.ONE_SECOND, 2 * TIME_CONSTANTS.ONE_SECOND, 4 * TIME_CONSTANTS.ONE_SECOND];
  private readonly ALERT_COOLDOWN_MS = TIME_CONSTANTS.ONE_HOUR;

  constructor() {
    this.config = getAIConfig();
    
    // Production-ready: Use local Transformers.js as primary, OpenAI as fallback
    const forceOpenAIAsPrimary = process.env.AI_FORCE_OPENAI_PRIMARY === 'true';
    
    if (forceOpenAIAsPrimary || this.config.primary === 'openai') {
      // Only use OpenAI as primary if explicitly forced
      this.primaryProvider = new OpenAIProvider();
      this.fallbackProvider = null;
    } else {
      // Default: Use local Transformers.js as primary, OpenAI as fallback
      this.primaryProvider = new TransformersProvider();
      this.fallbackProvider = this.config.fallback === 'openai' ? new OpenAIProvider() : null;
    }
    
    this.primaryHealth = {
      available: false,
      latency: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0
    };
    
    this.fallbackHealth = this.fallbackProvider ? {
      available: false,
      latency: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0
    } : null;
    
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      state: 'closed',
      openUntil: null
    };
    
    
    if (!this.fallbackProvider) {
      logger.warn('No fallback provider configured', {
        message: 'AI features will fail if local AI is unavailable'
      });
    }

    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    setInterval(() => this.checkProviderHealth(), 30 * TIME_CONSTANTS.ONE_SECOND);
    this.checkProviderHealth();
  }

  private async checkWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  private shouldResetFailures(lastCheck: Date): boolean {
    // Reset failures if cool-down period has passed
    const timeSinceLastCheck = Date.now() - lastCheck.getTime();
    return timeSinceLastCheck >= this.COOLDOWN_PERIOD_MS;
  }

  private async sendAlert(provider: string, consecutiveFailures: number, latestError?: string): Promise<void> {
    // Prevent alert spam - only send once per hour
    if (this.lastAlertTime && (Date.now() - this.lastAlertTime.getTime()) < this.ALERT_COOLDOWN_MS) {
      return;
    }

    const alertMessage = `CRITICAL: AI Provider ${provider} has ${consecutiveFailures} consecutive failures (threshold: ${this.CONSECUTIVE_FAILURE_THRESHOLD})`;
    
    logger.error('AI Provider Alert', undefined, {
      type: 'PROVIDER_FAILURE_ALERT',
      provider,
      consecutiveFailures,
      threshold: this.CONSECUTIVE_FAILURE_THRESHOLD,
      latestError: latestError || 'unknown',
      timestamp: new Date().toISOString()
    });

    this.lastAlertTime = new Date();
    this.alertSent = true;
  }

  private async checkProviderHealth(): Promise<void> {
    const startTime = Date.now();
    let latestError: string | undefined;
    
    try {
      const isAvailable = await this.checkWithTimeout(
        this.primaryProvider.isAvailable(),
        this.HEALTH_CHECK_TIMEOUT_MS,
        `Health check timeout after ${this.HEALTH_CHECK_TIMEOUT_MS}ms`
      );
      const latency = Date.now() - startTime;
      
      // Reset failures on success OR after cool-down period
      const shouldReset = isAvailable || this.shouldResetFailures(this.primaryHealth.lastCheck);
      const newFailures = isAvailable ? 0 : 
        shouldReset ? 1 : // Reset and count this failure
        Math.min(this.primaryHealth.consecutiveFailures + 1, this.CONSECUTIVE_FAILURE_THRESHOLD); // Cap at threshold
      
      this.primaryHealth = {
        available: isAvailable,
        latency,
        lastCheck: new Date(),
        consecutiveFailures: newFailures
      };
      
      // Update Prometheus metrics
      aiProviderHealth.set({ provider: this.primaryProvider.name, type: 'primary' }, isAvailable ? 1 : 0);
      aiProviderConsecutiveFailures.set({ provider: this.primaryProvider.name }, newFailures);
      aiProviderLatencyMs.observe({ provider: this.primaryProvider.name }, latency);
      
      // Send alert if threshold exceeded
      if (newFailures >= this.CONSECUTIVE_FAILURE_THRESHOLD) {
        await this.sendAlert(this.primaryProvider.name, newFailures, latestError);
      } else if (isAvailable && this.alertSent) {
        // Provider recovered - log recovery
        this.alertSent = false;
      }
      
    } catch (error) {
      latestError = error instanceof Error ? error.message : 'unknown error';
      const latency = Date.now() - startTime;
      const shouldReset = this.shouldResetFailures(this.primaryHealth.lastCheck);
      const newFailures = shouldReset ? 1 : 
        Math.min(this.primaryHealth.consecutiveFailures + 1, this.CONSECUTIVE_FAILURE_THRESHOLD);
      
      // Update full health state snapshot
      this.primaryHealth = {
        available: false,
        latency,
        lastCheck: new Date(),
        consecutiveFailures: newFailures
      };
      
      // Update Prometheus metrics for error case
      aiProviderHealth.set({ provider: this.primaryProvider.name, type: 'primary' }, 0);
      aiProviderConsecutiveFailures.set({ provider: this.primaryProvider.name }, newFailures);
      aiProviderLatencyMs.observe({ provider: this.primaryProvider.name }, latency);
      
      // Send alert if threshold exceeded
      if (newFailures >= this.CONSECUTIVE_FAILURE_THRESHOLD) {
        await this.sendAlert(this.primaryProvider.name, newFailures, latestError);
      }
      
      logger.error('Primary provider health check failed', error instanceof Error ? error : undefined, {
        consecutiveFailures: newFailures,
        latency,
        cooldownReset: shouldReset
      });
    }

    if (this.fallbackProvider) {
      const fallbackStartTime = Date.now();
      try {
        const isAvailable = await this.checkWithTimeout(
          this.fallbackProvider.isAvailable(),
          this.HEALTH_CHECK_TIMEOUT_MS,
          `Fallback health check timeout after ${this.HEALTH_CHECK_TIMEOUT_MS}ms`
        );
        const latency = Date.now() - fallbackStartTime;
        
        const prevHealth = this.fallbackHealth || { consecutiveFailures: 0, lastCheck: new Date() } as ProviderHealth;
        const shouldReset = isAvailable || this.shouldResetFailures(prevHealth.lastCheck);
        const newFailures = isAvailable ? 0 :
          shouldReset ? 1 :
          Math.min(prevHealth.consecutiveFailures + 1, this.CONSECUTIVE_FAILURE_THRESHOLD);
        
        this.fallbackHealth = {
          available: isAvailable,
          latency,
          lastCheck: new Date(),
          consecutiveFailures: newFailures
        };
        
        // Update Prometheus metrics for fallback
        aiProviderHealth.set({ provider: this.fallbackProvider.name, type: 'fallback' }, isAvailable ? 1 : 0);
        aiProviderConsecutiveFailures.set({ provider: this.fallbackProvider.name }, newFailures);
        aiProviderLatencyMs.observe({ provider: this.fallbackProvider.name }, latency);
        
      } catch (error) {
        const latency = Date.now() - fallbackStartTime;
        const prevHealth = this.fallbackHealth || { consecutiveFailures: 0, lastCheck: new Date() } as ProviderHealth;
        const shouldReset = this.shouldResetFailures(prevHealth.lastCheck);
        const newFailures = shouldReset ? 1 :
          Math.min(prevHealth.consecutiveFailures + 1, this.CONSECUTIVE_FAILURE_THRESHOLD);
        
        // Update full health state snapshot for fallback
        this.fallbackHealth = {
          available: false,
          latency,
          lastCheck: new Date(),
          consecutiveFailures: newFailures
        };
        
        // Update Prometheus metrics for fallback error case
        aiProviderHealth.set({ provider: this.fallbackProvider.name, type: 'fallback' }, 0);
        aiProviderConsecutiveFailures.set({ provider: this.fallbackProvider.name }, newFailures);
        aiProviderLatencyMs.observe({ provider: this.fallbackProvider.name }, latency);
        
        logger.error('Fallback provider health check failed', error instanceof Error ? error : undefined, {
          consecutiveFailures: newFailures,
          latency,
          cooldownReset: shouldReset
        });
      }
    }
  }

  private checkCircuitBreaker(): boolean {
    if (this.circuitBreaker.state === 'open') {
      if (this.circuitBreaker.openUntil && new Date() > this.circuitBreaker.openUntil) {
        this.circuitBreaker.state = 'half-open';
        
        // Update circuit breaker state metric (1 = half-open)
        aiProviderCircuitBreakerState.set({ provider: this.primaryProvider.name }, 1);
        return true;
      }
      logger.warn('Circuit breaker is open', {
        openUntil: this.circuitBreaker.openUntil
      });
      return false;
    }
    return true;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = new Date();
    
    if (this.circuitBreaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.openUntil = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT);
      logger.error('Circuit breaker opened due to failures', undefined, {
        failures: this.circuitBreaker.failures,
        openUntil: this.circuitBreaker.openUntil
      });
      
      // Update circuit breaker state metric (2 = open)
      aiProviderCircuitBreakerState.set({ provider: this.primaryProvider.name }, 2);
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.openUntil = null;
    
    // Update circuit breaker state metric (0 = closed)
    aiProviderCircuitBreakerState.set({ provider: this.primaryProvider.name }, 0);
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    providerName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt];
          logger.warn('Request failed, retrying', {
            provider: providerName,
            attempt: attempt + 1,
            maxRetries: this.MAX_RETRIES,
            nextRetryIn: delay,
            error: lastError.message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  private logRequest(log: AIRequestLog): void {
    this.requestLogs.push(log);
    if (this.requestLogs.length > this.maxLogSize) {
      this.requestLogs.shift();
    }
    
  }

  async chatCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    stream?: boolean;
    onToken?: (token: string) => void;
  }): Promise<string> {
    const requestId = randomUUID();
    const startTime = new Date();
    
    if (!this.checkCircuitBreaker()) {
      const error = new AIServiceError(
        'AI service temporarily unavailable due to repeated failures. Please try again later.',
        503
      );
      
      this.logRequest({
        id: requestId,
        provider: 'none',
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        success: false,
        error: error.message,
        systemPrompt: params.systemPrompt.substring(0, 100),
        userPrompt: params.userPrompt.substring(0, 100)
      });
      
      throw error;
    }

    try {
      const isAvailable = await this.primaryProvider.isAvailable();
      if (isAvailable) {
        try {
          const response = await this.retryWithBackoff(
            () => this.primaryProvider.chatCompletion(params),
            this.primaryProvider.name
          );
          
          const endTime = new Date();
          this.recordSuccess();
          
          this.logRequest({
            id: requestId,
            provider: this.primaryProvider.name,
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            success: true,
            systemPrompt: params.systemPrompt.substring(0, 100),
            userPrompt: params.userPrompt.substring(0, 100),
            response: response.substring(0, 100)
          });
          
          return response;
        } catch (error) {
          this.recordFailure();
          logger.error('Primary provider failed after retries', error instanceof Error ? error : undefined, {
            provider: this.primaryProvider.name
          });
          throw error;
        }
      } else {
        logger.warn('Primary provider not available', {
          provider: this.primaryProvider.name
        });
      }
    } catch (error) {
      logger.error('Primary provider error', error instanceof Error ? error : undefined);
    }

    if (this.fallbackProvider) {
      try {
        const isAvailable = await this.fallbackProvider.isAvailable();
        if (isAvailable) {
          
          const response = await this.retryWithBackoff(
            () => this.fallbackProvider!.chatCompletion(params),
            this.fallbackProvider.name
          );
          
          const endTime = new Date();
          
          this.logRequest({
            id: requestId,
            provider: this.fallbackProvider.name,
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            success: true,
            systemPrompt: params.systemPrompt.substring(0, 100),
            userPrompt: params.userPrompt.substring(0, 100),
            response: response.substring(0, 100)
          });
          
          return response;
        } else {
          logger.error('Fallback provider not available', undefined, {
            provider: this.fallbackProvider.name
          });
          // Don't throw here, let it fall through to final error
        }
      } catch (error) {
        logger.error('Fallback provider failed after retries', error instanceof Error ? error : undefined, {
          provider: this.fallbackProvider.name,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't rethrow fallback error, provide comprehensive error message
      }
    }

    // Both primary and fallback failed - provide detailed error
    const error = new AIServiceError(
      this.fallbackProvider 
        ? 'All AI providers are currently unavailable. Both primary and fallback providers failed. Please try again later or contact support.'
        : 'AI service is unavailable and no fallback provider is configured. Please check your configuration or contact support.',
      503
    );
    
    this.logRequest({
      id: requestId,
      provider: 'none',
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      success: false,
      error: error.message,
      systemPrompt: params.systemPrompt.substring(0, 100),
      userPrompt: params.userPrompt.substring(0, 100)
    });
    
    throw error;
  }

  async isAnyProviderAvailable(): Promise<boolean> {
    const primaryAvailable = await this.primaryProvider.isAvailable();
    if (primaryAvailable) return true;
    
    if (this.fallbackProvider) {
      return await this.fallbackProvider.isAvailable();
    }
    
    return false;
  }

  getProviderInfo(): { 
    primary: string; 
    fallback: string | null;
    primaryHealth: ProviderHealth;
    fallbackHealth: ProviderHealth | null;
    circuitBreaker: CircuitBreakerState;
  } {
    return {
      primary: this.primaryProvider.name,
      fallback: this.fallbackProvider?.name || null,
      primaryHealth: this.primaryHealth,
      fallbackHealth: this.fallbackHealth,
      circuitBreaker: this.circuitBreaker
    };
  }

  getRecentLogs(limit: number = 20): AIRequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  getStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageDuration: number;
  } {
    const total = this.requestLogs.length;
    const successful = this.requestLogs.filter(log => log.success).length;
    const failed = total - successful;
    const avgDuration = total > 0
      ? this.requestLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / total
      : 0;
    
    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      averageDuration: Math.round(avgDuration)
    };
  }
}

export const aiRouter = new AIProviderRouter();
