import { getAIConfig } from './base';
import { logger } from '../logger';
export class OllamaProvider {
    constructor() {
        this.name = 'Ollama/LocalAI (Local)';
        const config = getAIConfig();
        this.endpoint = config.localModelEndpoint || 'http://localhost:11434';
        this.model = config.localModel || 'llama3.2:latest';
    }
    async isAvailable() {
        try {
            const ollamaResponse = await fetch(`${this.endpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000),
            });
            if (ollamaResponse.ok) {
                logger.debug('Ollama provider available', { endpoint: this.endpoint });
                return true;
            }
        }
        catch (error) {
        }
        try {
            const localaiResponse = await fetch(`${this.endpoint}/v1/models`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000),
            });
            if (localaiResponse.ok) {
                logger.debug('LocalAI provider available', { endpoint: this.endpoint });
                return true;
            }
        }
        catch (error) {
            logger.debug('No local AI provider available', {
                endpoint: this.endpoint,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        return false;
    }
    async chatCompletion(params) {
        const messages = [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt }
        ];
        if (params.stream && params.onToken) {
            return await this.streamCompletion(messages, params);
        }
        try {
            const ollamaPayload = {
                model: this.model,
                messages,
                stream: false,
                format: params.jsonMode ? 'json' : undefined,
                options: {
                    temperature: params.temperature ?? 0.7,
                }
            };
            const response = await fetch(`${this.endpoint}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ollamaPayload),
                signal: AbortSignal.timeout(120000),
            });
            if (response.ok) {
                const data = await response.json();
                return data.message?.content || '';
            }
        }
        catch (error) {
            logger.debug('Ollama API format failed, trying OpenAI-compatible format');
        }
        const openaiPayload = {
            model: this.model,
            messages,
            response_format: params.jsonMode ? { type: 'json_object' } : undefined,
            temperature: params.temperature ?? 0.7,
        };
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(openaiPayload),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Local AI API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
    async streamCompletion(messages, params) {
        try {
            const ollamaPayload = {
                model: this.model,
                messages,
                stream: true,
                format: params.jsonMode ? 'json' : undefined,
                options: {
                    temperature: params.temperature ?? 0.7,
                }
            };
            const response = await fetch(`${this.endpoint}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ollamaPayload),
                signal: AbortSignal.timeout(120000),
            });
            if (response.ok && response.body) {
                return await this.handleOllamaStream(response.body, params.onToken);
            }
        }
        catch (error) {
            logger.debug('Ollama streaming failed, trying OpenAI-compatible format');
        }
        const openaiPayload = {
            model: this.model,
            messages,
            response_format: params.jsonMode ? { type: 'json_object' } : undefined,
            temperature: params.temperature ?? 0.7,
            stream: true,
        };
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(openaiPayload),
            signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Local AI streaming error: ${response.status} - ${error}`);
        }
        if (!response.body) {
            throw new Error('No response body for streaming');
        }
        return await this.handleOpenAIStream(response.body, params.onToken);
    }
    async handleOllamaStream(body, onToken) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        const content = data.message?.content || '';
                        if (content) {
                            fullResponse += content;
                            if (onToken) {
                                onToken(content);
                            }
                        }
                    }
                    catch (e) {
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        return fullResponse;
    }
    async handleOpenAIStream(body, onToken) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data:'));
                for (const line of lines) {
                    const data = line.replace(/^data: /, '');
                    if (data === '[DONE]')
                        break;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;
                            if (onToken) {
                                onToken(content);
                            }
                        }
                    }
                    catch (e) {
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        return fullResponse;
    }
}
