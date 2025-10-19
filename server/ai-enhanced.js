/**
 * Enhanced AI Integration with Retry Logic, Cost Tracking, and Circuit Breaker
 * Supports local AI (Ollama) with OpenAI fallback
 */
import OpenAI from 'openai';
import { logger } from './logger';
// Configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
const REQUEST_TIMEOUT = 30000; // 30 seconds
const circuitBreakers = new Map();
const costTracker = new Map();
/**
 * Get or initialize circuit breaker
 */
function getCircuitBreaker(provider) {
    if (!circuitBreakers.has(provider)) {
        circuitBreakers.set(provider, {
            failures: 0,
            lastFailureTime: 0,
            state: 'closed'
        });
    }
    return circuitBreakers.get(provider);
}
/**
 * Check if circuit breaker allows request
 */
function canMakeRequest(provider) {
    const breaker = getCircuitBreaker(provider);
    const now = Date.now();
    if (breaker.state === 'closed') {
        return true;
    }
    if (breaker.state === 'open') {
        if (now - breaker.lastFailureTime >= CIRCUIT_BREAKER_TIMEOUT) {
            breaker.state = 'half-open';
            logger.info('Circuit breaker entering half-open state', { provider });
            return true;
        }
        return false;
    }
    // half-open state
    return true;
}
/**
 * Record success for circuit breaker
 */
function recordSuccess(provider) {
    const breaker = getCircuitBreaker(provider);
    breaker.failures = 0;
    breaker.state = 'closed';
}
/**
 * Record failure for circuit breaker
 */
function recordFailure(provider) {
    const breaker = getCircuitBreaker(provider);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
        breaker.state = 'open';
        logger.warn('Circuit breaker opened', {
            provider,
            failures: breaker.failures
        });
    }
}
/**
 * Track AI costs
 */
function trackCost(provider, promptTokens, completionTokens, model) {
    if (!costTracker.has(provider)) {
        costTracker.set(provider, {
            requests: 0,
            tokens: { prompt: 0, completion: 0, total: 0 },
            estimatedCost: 0
        });
    }
    const tracker = costTracker.get(provider);
    tracker.requests++;
    tracker.tokens.prompt += promptTokens;
    tracker.tokens.completion += completionTokens;
    tracker.tokens.total += promptTokens + completionTokens;
    // Estimate cost (GPT-4o pricing as example)
    if (provider === 'openai') {
        const promptCost = (promptTokens / 1000000) * 2.50; // $2.50 per 1M tokens
        const completionCost = (completionTokens / 1000000) * 10.00; // $10 per 1M tokens
        tracker.estimatedCost += promptCost + completionCost;
    }
}
/**
 * Get cost statistics
 */
export function getCostStatistics() {
    return Object.fromEntries(costTracker.entries());
}
/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt) {
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
    // Add jitter
    return delay + Math.random() * 1000;
}
/**
 * Enhanced AI request with retry logic
 */
export async function makeAIRequest(provider, requestFn, options = {}) {
    const { timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES, fallbackProvider, fallbackFn } = options;
    // Check circuit breaker
    if (!canMakeRequest(provider)) {
        logger.warn('Circuit breaker is open', { provider });
        if (fallbackProvider && fallbackFn) {
            logger.info('Using fallback provider', { fallback: fallbackProvider });
            return makeAIRequest(fallbackProvider, fallbackFn, { ...options, fallbackProvider: undefined });
        }
        throw new Error(`AI service ${provider} is temporarily unavailable`);
    }
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeout);
            });
            // Race between request and timeout
            const result = await Promise.race([
                requestFn(),
                timeoutPromise
            ]);
            // Success
            recordSuccess(provider);
            return result;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            recordFailure(provider);
            logger.warn('AI request failed', {
                provider,
                attempt: attempt + 1,
                maxRetries: retries + 1,
                error: lastError.message
            });
            // Don't retry on last attempt
            if (attempt < retries) {
                const delay = getRetryDelay(attempt);
                logger.info('Retrying AI request', { provider, delay, attempt: attempt + 1 });
                await sleep(delay);
            }
        }
    }
    // All retries failed, try fallback
    if (fallbackProvider && fallbackFn) {
        logger.info('All retries failed, using fallback', {
            provider,
            fallback: fallbackProvider
        });
        return makeAIRequest(fallbackProvider, fallbackFn, { ...options, fallbackProvider: undefined });
    }
    throw lastError || new Error('AI request failed');
}
/**
 * Enhanced OpenAI client with retry logic
 */
export class EnhancedAIClient {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
    }
    /**
     * Chat completion with retry and cost tracking
     */
    async chatCompletion(messages, options = {}) {
        const model = options.model || 'gpt-4o';
        const result = await makeAIRequest('openai', async () => {
            const response = await this.openai.chat.completions.create({
                model,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens,
                stream: options.stream || false
            });
            // Track costs
            if ('usage' in response) {
                trackCost('openai', response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0, model);
            }
            return response;
        }, {
            timeout: 60000, // 60 seconds for longer AI requests
            retries: 3
        });
        return result;
    }
    /**
     * Streaming chat completion
     */
    async streamChatCompletion(messages, onChunk, options = {}) {
        const model = options.model || 'gpt-4o';
        await makeAIRequest('openai', async () => {
            const stream = await this.openai.chat.completions.create({
                model,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens,
                stream: true
            });
            let totalTokens = 0;
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    onChunk(content);
                    totalTokens += content.length / 4; // Rough estimate
                }
            }
            // Estimate cost tracking for streaming
            trackCost('openai', totalTokens, totalTokens, model);
        }, {
            timeout: 120000, // 2 minutes for streaming
            retries: 2
        });
    }
}
/**
 * Initialize AI client with environment configuration
 */
export function initializeAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required');
    }
    return new EnhancedAIClient(apiKey);
}
/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus() {
    return Object.fromEntries(circuitBreakers.entries());
}
/**
 * Reset circuit breaker
 */
export function resetCircuitBreaker(provider) {
    circuitBreakers.delete(provider);
    logger.info('Circuit breaker reset', { provider });
}
