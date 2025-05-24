// server/services/openai.ts
import OpenAI from 'openai';
import NodeCache from 'node-cache';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const cache = new NodeCache({ stdTTL: 300 }); // cache for 5 minutes

export async function generateResponse({
  prompt,
  context = [],
  model = 'gpt-3.5-turbo',
  cacheKey,
  stream = false,
  onChunk,
}: {
  prompt: string;
  context?: string[];
  model?: string;
  cacheKey?: string;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}): Promise<string> {
  if (!prompt) throw new Error("Prompt is required");

  const key = cacheKey || `completion:${model}:${context.join('|')}|${prompt}`;

  if (!stream && cache.has(key)) {
    return cache.get<string>(key)!;
  }

  const messages = [
    { role: "system", content: "You are EchoTeacher, a helpful AI tutor." },
    ...context.map((msg, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: msg
    })),
    { role: "user", content: prompt }
  ];

  if (stream) {
    const streamResponse = await openai.chat.completions.create({
      model,
      messages,
      stream: true
    });

    let result = '';
    for await (const chunk of streamResponse) {
      const delta = chunk.choices[0]?.delta?.content || '';
      result += delta;
      onChunk?.(delta);
    }

    cache.set(key, result);
    return result;
  }

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 500
  });

  const content = completion.choices[0].message.content || '';
  cache.set(key, content);
  return content;
}

export async function analyzeSentiment(text: string) {
  const result = await generateResponse({
    prompt: text,
    context: [
      "You are a sentiment analysis expert. Reply with JSON: { 'sentiment': 'positive' | 'negative' | 'neutral', 'score': 0-1 }"
    ],
    model: "gpt-3.5-turbo"
  });

  try {
    return JSON.parse(result);
  } catch {
    return { sentiment: "neutral", score: 0.5 };
  }
}
