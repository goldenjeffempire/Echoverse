import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(message: string, context: string[] = []): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are EchoTeacher, a helpful AI tutor. Provide clear, concise explanations." 
        },
        ...context.map((msg, i) => ({
          role: (i % 2 === 0) ? "user" : "assistant",
          content: msg
        })),
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content || "I apologize, but I couldn't generate a response.";
  } catch (error: any) {
    console.error('OpenAI API Error:', error);

    // Handle rate limits
    if (error?.status === 429) {
      return "I apologize, but our AI service is currently at capacity. Please try again in a moment.";
    }

    // Handle other errors
    return "I apologize, but I encountered an error while processing your request.";
  }
}

/**
 * Analyze sentiment of a message
 * @param text Text to analyze
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: "positive" | "negative" | "neutral";
  score: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating. Respond with JSON in this format: { 'sentiment': 'positive' | 'negative' | 'neutral', 'score': number between 0 and 1 }",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Ensure we have a valid content string
    const content = response.choices[0].message.content;
    const contentString = typeof content === 'string' ? content : '{"sentiment": "neutral", "score": 0.5}';
    const result = JSON.parse(contentString);
    return {
      sentiment: result.sentiment,
      score: result.score,
    };
  } catch (error: any) {
    console.error("Error analyzing sentiment:", error);
    // Log the error but return a neutral sentiment
    return {
      sentiment: "neutral",
      score: 0.5,
    };
  }
}