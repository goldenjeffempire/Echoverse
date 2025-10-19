import { getAIConfig } from './base';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { AIServiceError } from '../utils/errors';
import { logger } from '../logger';
import { randomUUID } from 'crypto';
import { aiProviderHealth, aiProviderConsecutiveFailures, aiProviderLatencyMs, aiProviderCircuitBreakerState } from '../monitoring/metrics';
import { TIME_CONSTANTS, AI_CONFIG } from '@shared/constants';
class AIProviderRouter {
    constructor() {
        this.requestLogs = [];
        this.maxLogSize = 100;
        this.alertSent = false;
        this.lastAlertTime = null;
        // Configurable thresholds from environment or defaults
        this.CONSECUTIVE_FAILURE_THRESHOLD = parseInt(process.env.AI_PROVIDER_FAILURE_THRESHOLD ?? '5', 10);
        this.COOLDOWN_PERIOD_MS = parseInt(process.env.AI_PROVIDER_COOLDOWN_MS ?? String(5 * TIME_CONSTANTS.ONE_MINUTE), 10);
        this.HEALTH_CHECK_TIMEOUT_MS = parseInt(process.env.AI_PROVIDER_HEALTH_TIMEOUT_MS ?? String(3 * TIME_CONSTANTS.ONE_SECOND), 10);
        this.CIRCUIT_BREAKER_THRESHOLD = 5;
        this.CIRCUIT_BREAKER_TIMEOUT = TIME_CONSTANTS.ONE_MINUTE;
        this.MAX_RETRIES = AI_CONFIG.MAX_RETRIES;
        this.RETRY_DELAYS = [TIME_CONSTANTS.ONE_SECOND, 2 * TIME_CONSTANTS.ONE_SECOND, 4 * TIME_CONSTANTS.ONE_SECOND];
        this.ALERT_COOLDOWN_MS = TIME_CONSTANTS.ONE_HOUR;
        this.config = getAIConfig();
        // Cloud-deployment friendly: Allow OpenAI as primary when local AI infrastructure isn't available
        const allowOpenAIAsPrimary = process.env.AI_ALLOW_OPENAI_PRIMARY === 'true' || process.env.NODE_ENV === 'production';
        if (this.config.primary === 'local' || (this.config.primary !== 'openai' && !allowOpenAIAsPrimary)) {
            this.primaryProvider = new OllamaProvider();
            this.fallbackProvider = this.config.fallback === 'openai' ? new OpenAIProvider() : null;
        }
        else if (this.config.primary === 'openai' || allowOpenAIAsPrimary) {
            // Cloud deployment: Use OpenAI as primary when local infrastructure unavailable
            this.primaryProvider = new OpenAIProvider();
            this.fallbackProvider = null; // No fallback needed when OpenAI is primary
            logger.info('Using OpenAI as primary AI provider for cloud deployment');
        }
        else {
            throw new Error(`CONFIGURATION ERROR: Invalid AI_PROVIDER_PRIMARY: "${this.config.primary}". ` +
                `Supported values: "local" (with Ollama) or "openai" (cloud deployment).`);
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
    startHealthChecks() {
        setInterval(() => this.checkProviderHealth(), 30 * TIME_CONSTANTS.ONE_SECOND);
        this.checkProviderHealth();
    }
    async checkWithTimeout(promise, timeoutMs, errorMessage) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        });
        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    shouldResetFailures(lastCheck) {
        // Reset failures if cool-down period has passed
        const timeSinceLastCheck = Date.now() - lastCheck.getTime();
        return timeSinceLastCheck >= this.COOLDOWN_PERIOD_MS;
    }
    async sendAlert(provider, consecutiveFailures, latestError) {
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
    async checkProviderHealth() {
        const startTime = Date.now();
        let latestError;
        try {
            const isAvailable = await this.checkWithTimeout(this.primaryProvider.isAvailable(), this.HEALTH_CHECK_TIMEOUT_MS, `Health check timeout after ${this.HEALTH_CHECK_TIMEOUT_MS}ms`);
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
            }
            else if (isAvailable && this.alertSent) {
                // Provider recovered - log recovery
                logger.info('AI Provider recovered', {
                    provider: this.primaryProvider.name,
                    wasDown: this.alertSent
                });
                this.alertSent = false;
            }
            logger.debug('Primary provider health check', {
                provider: this.primaryProvider.name,
                available: isAvailable,
                latency,
                consecutiveFailures: this.primaryHealth.consecutiveFailures,
                cooldownReset: shouldReset && !isAvailable
            });
        }
        catch (error) {
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
                const isAvailable = await this.checkWithTimeout(this.fallbackProvider.isAvailable(), this.HEALTH_CHECK_TIMEOUT_MS, `Fallback health check timeout after ${this.HEALTH_CHECK_TIMEOUT_MS}ms`);
                const latency = Date.now() - fallbackStartTime;
                const prevHealth = this.fallbackHealth || { consecutiveFailures: 0, lastCheck: new Date() };
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
                logger.debug('Fallback provider health check', {
                    provider: this.fallbackProvider.name,
                    available: isAvailable,
                    latency,
                    consecutiveFailures: this.fallbackHealth.consecutiveFailures
                });
            }
            catch (error) {
                const latency = Date.now() - fallbackStartTime;
                const prevHealth = this.fallbackHealth || { consecutiveFailures: 0, lastCheck: new Date() };
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
    checkCircuitBreaker() {
        if (this.circuitBreaker.state === 'open') {
            if (this.circuitBreaker.openUntil && new Date() > this.circuitBreaker.openUntil) {
                logger.info('Circuit breaker transitioning to half-open', {
                    failures: this.circuitBreaker.failures
                });
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
    recordFailure() {
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
    recordSuccess() {
        if (this.circuitBreaker.state === 'half-open') {
            logger.info('Circuit breaker closing after successful request');
        }
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.state = 'closed';
        this.circuitBreaker.openUntil = null;
        // Update circuit breaker state metric (0 = closed)
        aiProviderCircuitBreakerState.set({ provider: this.primaryProvider.name }, 0);
    }
    async retryWithBackoff(fn, providerName) {
        let lastError;
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
            }
            catch (error) {
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
    logRequest(log) {
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
    async chatCompletion(params) {
        const requestId = randomUUID();
        const startTime = new Date();
        if (!this.checkCircuitBreaker()) {
            const error = new AIServiceError('AI service temporarily unavailable due to repeated failures. Please try again later.', 503);
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
                    const response = await this.retryWithBackoff(() => this.primaryProvider.chatCompletion(params), this.primaryProvider.name);
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
                }
                catch (error) {
                    this.recordFailure();
                    logger.error('Primary provider failed after retries', error instanceof Error ? error : undefined, {
                        provider: this.primaryProvider.name
                    });
                    throw error;
                }
            }
            else {
                logger.warn('Primary provider not available', {
                    provider: this.primaryProvider.name
                });
            }
        }
        catch (error) {
            logger.error('Primary provider error', error instanceof Error ? error : undefined);
        }
        if (this.fallbackProvider) {
            try {
                const isAvailable = await this.fallbackProvider.isAvailable();
                if (isAvailable) {
                    logger.info('Using fallback provider', {
                        provider: this.fallbackProvider.name
                    });
                    const response = await this.retryWithBackoff(() => this.fallbackProvider.chatCompletion(params), this.fallbackProvider.name);
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
                }
                else {
                    logger.error('Fallback provider not available', undefined, {
                        provider: this.fallbackProvider.name
                    });
                    // Don't throw here, let it fall through to final error
                }
            }
            catch (error) {
                logger.error('Fallback provider failed after retries', error instanceof Error ? error : undefined, {
                    provider: this.fallbackProvider.name,
                    error: error instanceof Error ? error.message : String(error)
                });
                // Don't rethrow fallback error, provide comprehensive error message
            }
        }
        // Both primary and fallback failed - provide detailed error
        const error = new AIServiceError(this.fallbackProvider
            ? 'All AI providers are currently unavailable. Both primary and fallback providers failed. Please try again later or contact support.'
            : 'AI service is unavailable and no fallback provider is configured. Please check your configuration or contact support.', 503);
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
    async isAnyProviderAvailable() {
        const primaryAvailable = await this.primaryProvider.isAvailable();
        if (primaryAvailable)
            return true;
        if (this.fallbackProvider) {
            return await this.fallbackProvider.isAvailable();
        }
        return false;
    }
    getProviderInfo() {
        return {
            primary: this.primaryProvider.name,
            fallback: this.fallbackProvider?.name || null,
            primaryHealth: this.primaryHealth,
            fallbackHealth: this.fallbackHealth,
            circuitBreaker: this.circuitBreaker
        };
    }
    getRecentLogs(limit = 20) {
        return this.requestLogs.slice(-limit);
    }
    getStats() {
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
