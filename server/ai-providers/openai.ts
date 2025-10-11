import OpenAI from 'openai';
import { AIProvider } from './base';
import { APIKeyMissingError, QuotaExceededError, AIServiceError } from '../utils/errors';
import { logger } from '../logger';
import { costTracker } from './cost-tracker';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI (Fallback)';
  private client: OpenAI | null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.client && !!this.apiKey;
  }

  async chatCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    stream?: boolean;
    onToken?: (token: string) => void;
  }): Promise<string> {
    if (!this.client) {
      throw new APIKeyMissingError();
    }

    try {
      if (params.stream && params.onToken) {
        return await this.streamCompletion(params);
      }

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt }
        ],
        response_format: params.jsonMode ? { type: 'json_object' } : undefined,
        temperature: params.temperature ?? 0.7,
      });

      const content = response.choices[0].message.content || '';
      
      if (response.usage) {
        logger.debug('OpenAI token usage', {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        });
        
        // Track AI costs
        costTracker.track({
          provider: 'openai',
          model: 'gpt-4o',
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          feature: 'chat_completion'
        });
      }

      return content;
    } catch (error: any) {
      logger.error('OpenAI API error', error instanceof Error ? error : undefined, { 
        status: error.status, 
        code: error.code 
      });
      
      if (error.status === 429 || error.code === 'insufficient_quota') {
        throw new QuotaExceededError();
      }
      
      if (error.status === 401 || error.code === 'invalid_api_key') {
        throw new APIKeyMissingError();
      }
      
      throw new AIServiceError(
        error.message || 'OpenAI service encountered an error',
        error.status || 503
      );
    }
  }

  private async streamCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    onToken?: (token: string) => void;
  }): Promise<string> {
    if (!this.client) {
      throw new APIKeyMissingError();
    }

    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt }
      ],
      response_format: params.jsonMode ? { type: 'json_object' } : undefined,
      temperature: params.temperature ?? 0.7,
      stream: true,
    });

    let fullResponse = '';
    let estimatedTokens = 0;
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        estimatedTokens += Math.ceil(content.length / 4); // Rough estimate: 1 token ≈ 4 chars
        if (params.onToken) {
          params.onToken(content);
        }
      }
    }
    
    // Track streaming costs (estimated)
    costTracker.track({
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4),
      completionTokens: estimatedTokens,
      totalTokens: Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4) + estimatedTokens,
      feature: 'chat_completion_stream'
    });

    return fullResponse;
  }
}
