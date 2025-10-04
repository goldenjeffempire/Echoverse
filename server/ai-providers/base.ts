export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  
  chatCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    jsonMode?: boolean;
    temperature?: number;
    stream?: boolean;
    onToken?: (token: string) => void;
  }): Promise<string>;
}

export interface AIProviderConfig {
  primary: 'local' | 'openai';
  fallback: 'openai' | 'none';
  localModelEndpoint?: string;
  localModel?: string;
}

export function getAIConfig(): AIProviderConfig {
  return {
    primary: (process.env.AI_PROVIDER_PRIMARY as 'local' | 'openai') || 'local',
    fallback: (process.env.AI_PROVIDER_FALLBACK as 'openai' | 'none') || 'openai',
    localModelEndpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434',
    localModel: process.env.LOCAL_AI_MODEL || 'llama3.2:latest',
  };
}

export interface ProviderHealth {
  available: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIRequestLog {
  id: string;
  provider: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success: boolean;
  error?: string;
  tokenUsage?: TokenUsage;
  systemPrompt: string;
  userPrompt: string;
  response?: string;
}
