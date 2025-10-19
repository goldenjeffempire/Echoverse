/**
 * Local Transformers.js AI Provider
 * Runs lightweight AI models locally using @xenova/transformers
 * Production-ready alternative to Ollama for cloud deployments
 */
import { pipeline, env } from '@xenova/transformers';
import { AIServiceError } from '../utils/errors';
import { logger } from '../logger';
// Configure transformers.js to use local cache
env.localModelPath = './models';
env.allowRemoteModels = true;
env.allowLocalModels = true;
export class TransformersProvider {
    constructor() {
        this.name = 'Transformers.js (Local)';
        this.textGenerator = null;
        this.chatModel = null;
        this.initialized = false;
        this.initPromise = null;
        // Use lightweight models that work well in constrained environments
        this.TEXT_MODEL = 'Xenova/gpt2';
        this.CHAT_MODEL = 'Xenova/LaMini-Flan-T5-783M';
        this.initPromise = this.initialize();
    }
    async isAvailable() {
        try {
            await this.ensureInitialized();
            return this.initialized && !!this.textGenerator;
        }
        catch {
            return false;
        }
    }
    async chatCompletion(params) {
        await this.ensureInitialized();
        const messages = [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt }
        ];
        const result = await this.generateChatResponse(messages, {
            temperature: params.temperature,
            maxTokens: 500
        });
        return result.message;
    }
    async initialize() {
        if (this.initialized)
            return;
        try {
            logger.info('Initializing Transformers.js local AI provider...', {
                textModel: this.TEXT_MODEL,
                chatModel: this.CHAT_MODEL
            });
            // Initialize text generation pipeline with lightweight model
            this.textGenerator = await pipeline('text-generation', this.TEXT_MODEL);
            this.initialized = true;
            logger.info('Local AI provider initialized successfully', {
                provider: this.name,
                model: this.TEXT_MODEL
            });
        }
        catch (error) {
            logger.error('Failed to initialize local AI provider', error instanceof Error ? error : undefined);
            throw new AIServiceError('Failed to initialize local AI models', 500);
        }
    }
    async checkHealth() {
        const startTime = Date.now();
        try {
            await this.ensureInitialized();
            if (!this.textGenerator) {
                return {
                    available: false,
                    latency: Date.now() - startTime,
                    lastCheck: new Date(),
                    consecutiveFailures: 1
                };
            }
            // Quick health check with a simple prompt
            await this.textGenerator('Hello', { max_new_tokens: 5 });
            return {
                available: true,
                latency: Date.now() - startTime,
                lastCheck: new Date(),
                consecutiveFailures: 0
            };
        }
        catch (error) {
            return {
                available: false,
                latency: Date.now() - startTime,
                lastCheck: new Date(),
                consecutiveFailures: 1
            };
        }
    }
    async ensureInitialized() {
        if (!this.initialized && this.initPromise) {
            await this.initPromise;
        }
        if (!this.initialized) {
            throw new AIServiceError('Local AI provider not initialized', 500);
        }
    }
    async generateText(prompt, options = {}) {
        await this.ensureInitialized();
        try {
            const fullPrompt = options.systemPrompt
                ? `${options.systemPrompt}\n\nUser: ${prompt}\nAssistant:`
                : prompt;
            const result = await this.textGenerator(fullPrompt, {
                max_new_tokens: options.maxTokens || 150,
                temperature: options.temperature || 0.7,
                do_sample: true,
                top_k: 50,
                top_p: 0.95,
            });
            const generatedText = result[0]?.generated_text || '';
            const responseText = generatedText.replace(fullPrompt, '').trim();
            // Estimate token usage (rough approximation)
            const promptTokens = Math.ceil(fullPrompt.length / 4);
            const completionTokens = Math.ceil(responseText.length / 4);
            return {
                text: responseText,
                usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens
                }
            };
        }
        catch (error) {
            logger.error('Local AI generation error', error instanceof Error ? error : undefined);
            throw new AIServiceError('Failed to generate text with local AI', 500);
        }
    }
    async generateChatResponse(messages, options = {}) {
        await this.ensureInitialized();
        try {
            // Convert chat messages to a single prompt
            const prompt = messages
                .map(msg => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                return `${role}: ${msg.content}`;
            })
                .join('\n') + '\nAssistant:';
            const result = await this.textGenerator(prompt, {
                max_new_tokens: options.maxTokens || 200,
                temperature: options.temperature || 0.7,
                do_sample: true,
                top_k: 50,
                top_p: 0.95,
            });
            const generatedText = result[0]?.generated_text || '';
            const responseText = generatedText.replace(prompt, '').trim();
            const promptTokens = Math.ceil(prompt.length / 4);
            const completionTokens = Math.ceil(responseText.length / 4);
            return {
                message: responseText,
                usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens
                }
            };
        }
        catch (error) {
            logger.error('Local AI chat error', error instanceof Error ? error : undefined);
            throw new AIServiceError('Failed to generate chat response with local AI', 500);
        }
    }
    async generateStream(prompt, options = {}) {
        // For now, return non-streaming response as a single chunk
        // Future enhancement: implement true streaming with transformers.js
        const result = await this.generateText(prompt, options);
        async function* streamResponse() {
            yield result.text;
        }
        return streamResponse();
    }
    estimateCost(usage) {
        // Local models are free!
        return 0;
    }
}
