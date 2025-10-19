// AI Provider Health Check and Latency Testing
import { aiRouter } from './ai-providers/router';
import { logger } from './logger';

interface HealthCheckResult {
  provider: string;
  available: boolean;
  latency: number;
  timestamp: Date;
  error?: string;
}

export async function testAIProviderHealth(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  
  // Test Ollama (Primary)
  try {
    const startTime = Date.now();
    const ollamaHealth = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const latency = Date.now() - startTime;
    
    results.push({
      provider: 'Ollama (Primary)',
      available: ollamaHealth.ok,
      latency,
      timestamp: new Date()
    });
    
    logger.info('Ollama health check completed', { latency, available: ollamaHealth.ok });
  } catch (error) {
    results.push({
      provider: 'Ollama (Primary)',
      available: false,
      latency: 0,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error)
    });
    
    logger.warn('Ollama health check failed', { error });
  }
  
  // Test OpenAI (Fallback)
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    results.push({
      provider: 'OpenAI (Fallback)',
      available: hasOpenAIKey,
      latency: 0,
      timestamp: new Date(),
      error: hasOpenAIKey ? undefined : 'API key not configured'
    });
    
    logger.info('OpenAI availability check', { available: hasOpenAIKey });
  } catch (error) {
    results.push({
      provider: 'OpenAI (Fallback)',
      available: false,
      latency: 0,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return results;
}

export async function runAILatencyBenchmark(): Promise<void> {
  logger.info('Starting AI provider latency benchmark');
  
  const iterations = 10;
  const latencies: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - startTime;
      latencies.push(latency);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('Benchmark iteration failed', error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  if (latencies.length > 0) {
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    
    logger.info('AI latency benchmark completed', {
      iterations: latencies.length,
      avgLatency: `${avgLatency.toFixed(2)}ms`,
      minLatency: `${minLatency}ms`,
      maxLatency: `${maxLatency}ms`,
      latencies
    });
  }
}

// Export automated health monitoring
export function startAIHealthMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('Starting automated AI health monitoring', { intervalMs });
  
  return setInterval(async () => {
    const results = await testAIProviderHealth();
    const allHealthy = results.every(r => r.available);
    
    if (!allHealthy) {
      logger.warn('AI provider health check detected issues', { results });
    } else {
      logger.debug('All AI providers healthy', { results });
    }
  }, intervalMs);
}
