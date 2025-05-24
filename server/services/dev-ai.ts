// server/services/dev-ai.ts
import type { Express, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { generateResponse } from './openai';

interface DevResponse {
  code?: string;
  explanation?: string;
  suggestions?: string[];
}

// Util function: Uses OpenAI to generate a DevResponse
async function generateDevResponse(
  prompt: string,
  systemPrompt: string
): Promise<DevResponse> {
  if (!prompt || !systemPrompt) {
    throw new Error("Both prompt and systemPrompt are required");
  }

  try {
    const content = await generateResponse(prompt, [systemPrompt]);

    try {
      const response: DevResponse = JSON.parse(content);
      return response;
    } catch (parseError) {
      console.error("Error parsing generated content:", parseError);
      throw new Error("Failed to parse content into DevResponse format");
    }
  } catch (error) {
    console.error("Error generating dev response:", error);
    throw new Error("Failed to generate development response");
  }
}

// Express route: Handles POST /api/dev-ai/generate
export function setupDevAIRoutes(app: Express) {
  app.post('/api/dev-ai/generate', requireAuth, async (req: Request, res: Response) => {
    const { prompt, systemPrompt } = req.body;

    if (!prompt || !systemPrompt) {
      return res.status(400).json({ error: 'Prompt and systemPrompt are required' });
    }

    try {
      const devResponse = await generateDevResponse(prompt, systemPrompt);
      res.json({ result: devResponse });
    } catch (err) {
      console.error('Dev AI error:', err);
      res.status(500).json({ error: 'AI generation failed' });
    }
  });
}
