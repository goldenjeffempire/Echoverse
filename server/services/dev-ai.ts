
import { generateResponse } from './openai';

interface DevResponse {
  code?: string;
  explanation?: string;
  suggestions?: string[];
}

export async function generateDevResponse(
  prompt: string,
  systemPrompt: string
): Promise<DevResponse> {
  try {
    if (!prompt || !systemPrompt) {
      throw new Error("Both prompt and systemPrompt are required");
    }

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
