/**
 * Mock Ollama Service for Development
 * Provides a lightweight local AI endpoint for testing
 */

import express from 'express';
import { logger } from './logger';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Ollama is running' });
});

app.get('/api/tags', (req, res) => {
  res.json({
    models: [
      {
        name: 'llama2:latest',
        modified_at: new Date().toISOString(),
        size: 3826793677,
        digest: 'mock-digest'
      }
    ]
  });
});

app.post('/api/generate', (req, res) => {
  const { prompt, model } = req.body;
  
  logger.debug('Mock Ollama generate request', { model, promptLength: prompt?.length });
  
  const response = `Mock AI Response: I received your prompt and would process it with ${model || 'default model'}. This is a development mock endpoint. For production, use the OpenAI fallback.`;
  
  res.json({
    model: model || 'llama2',
    created_at: new Date().toISOString(),
    response: response,
    done: true
  });
});

app.post('/api/chat', (req, res) => {
  const { messages, model } = req.body;
  
  logger.debug('Mock Ollama chat request', { model, messageCount: messages?.length });
  
  const response = {
    model: model || 'llama2',
    created_at: new Date().toISOString(),
    message: {
      role: 'assistant',
      content: 'Mock AI Response: This is a development mock. For production AI capabilities, the system uses OpenAI as the fallback provider.'
    },
    done: true
  };
  
  res.json(response);
});

const PORT = 11434;

export function startMockOllama() {
  app.listen(PORT, '127.0.0.1', () => {
    logger.info(`Mock Ollama service running on http://localhost:${PORT}`);
    logger.info('This is a development mock - production uses OpenAI fallback');
  });
}
