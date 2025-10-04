import { AIProvider, getAIConfig, ProviderHealth, TokenUsage, AIRequestLog } from './base';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { AIServiceError } from '../utils/errors';
import { logger } from '../logger';
import { randomUUID } from 'crypto';

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
  
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000];

  constructor() {
    this.config = getAIConfig();
    
    if (this.config.primary !== 'local') {
      throw new Error(
        `CONFIGURATION ERROR: AI_PROVIDER_PRIMARY must be "local" per platform requirements. ` +
        `Found: "${this.config.primary}". OpenAI can ONLY be used as fallback (AI_PROVIDER_FALLBACK=openai).`
      );
    }
    
    this.primaryProvider = new OllamaProvider();
    this.fallbackProvider = this.config.fallback === 'openai' ? new OpenAIProvider() : null;
    
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
    
    const fallbackInfo = this.fallbackProvider ? 'OpenAI' : 'None';
    logger.info('AI Provider initialized', {
      primary: this.primaryProvider.name,
      fallback: fallbackInfo
    });
    
    if (!this.fallbackProvider) {
      logger.warn('No fallback provider configured', {
        message: 'AI features will fail if local AI is unavailable'
      });
    }

    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    setInterval(() => this.checkProviderHealth(), 30000);
    this.checkProviderHealth();
  }

  private async checkProviderHealth(): Promise<void> {
    const startTime = Date.now();
    try {
      const isAvailable = await this.primaryProvider.isAvailable();
      const latency = Date.now() - startTime;
      
      this.primaryHealth = {
        available: isAvailable,
        latency,
        lastCheck: new Date(),
        consecutiveFailures: isAvailable ? 0 : this.primaryHealth.consecutiveFailures + 1
      };
      
      logger.debug('Primary provider health check', {
        provider: this.primaryProvider.name,
        available: isAvailable,
        latency,
        consecutiveFailures: this.primaryHealth.consecutiveFailures
      });
    } catch (error) {
      this.primaryHealth.consecutiveFailures++;
      logger.error('Primary provider health check failed', error instanceof Error ? error : undefined);
    }

    if (this.fallbackProvider) {
      const fallbackStartTime = Date.now();
      try {
        const isAvailable = await this.fallbackProvider.isAvailable();
        const latency = Date.now() - fallbackStartTime;
        
        this.fallbackHealth = {
          available: isAvailable,
          latency,
          lastCheck: new Date(),
          consecutiveFailures: isAvailable ? 0 : (this.fallbackHealth?.consecutiveFailures || 0) + 1
        };
        
        logger.debug('Fallback provider health check', {
          provider: this.fallbackProvider.name,
          available: isAvailable,
          latency,
          consecutiveFailures: this.fallbackHealth.consecutiveFailures
        });
      } catch (error) {
        if (this.fallbackHealth) {
          this.fallbackHealth.consecutiveFailures++;
        }
        logger.error('Fallback provider health check failed', error instanceof Error ? error : undefined);
      }
    }
  }

  private checkCircuitBreaker(): boolean {
    if (this.circuitBreaker.state === 'open') {
      if (this.circuitBreaker.openUntil && new Date() > this.circuitBreaker.openUntil) {
        logger.info('Circuit breaker transitioning to half-open', {
          failures: this.circuitBreaker.failures
        });
        this.circuitBreaker.state = 'half-open';
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
    }
  }

  private recordSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      logger.info('Circuit breaker closing after successful request');
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.openUntil = null;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    providerName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await fn();
        if (attempt > 0) {
          logger.info('Retry succeeded', {
            provider: providerName,
            attempt: attempt + 1
          });
        }
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
    
    logger.info('AI request completed', {
      id: log.id,
      provider: log.provider,
      duration: log.duration,
      success: log.success,
      tokenUsage: log.tokenUsage,
      error: log.error
    });
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
          logger.info('Using fallback provider', {
            provider: this.fallbackProvider.name
          });
          
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
        }
      } catch (error) {
        logger.error('Fallback provider failed', error instanceof Error ? error : undefined);
        throw error;
      }
    }

    const error = new AIServiceError(
      'All AI providers are unavailable. Please check your configuration or try again later.',
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
