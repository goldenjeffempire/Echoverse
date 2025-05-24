// server/routes/openai.ts
import type { Express, Request, Response } from 'express';
import { generateResponse } from '../services/openai';
import { requireAuth } from '../auth';

export function setupOpenAIRoutes(app: Express) {
  app.post('/api/openai/completion', requireAuth, async (req: Request, res: Response) => {
    const { prompt, context, model, stream } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      try {
        await generateResponse({
          prompt,
          context,
          model,
          stream: true,
          onChunk: (chunk) => res.write(`data: ${chunk}\n\n`)
        });
        res.write('event: done\ndata: [DONE]\n\n');
        res.end();
      } catch (err) {
        console.error("Streaming error:", err);
        res.write('event: error\ndata: Failed to stream response\n\n');
        res.end();
      }
    } else {
      try {
        const result = await generateResponse({ prompt, context, model });
        res.json({ result });
      } catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({ error: 'OpenAI request failed' });
      }
    }
  });
}
