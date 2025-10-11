import { logger } from '../logger';
import { AIServiceError } from './errors';

/**
 * Safely parses JSON with comprehensive error handling and validation
 */
export function safeJSONParse<T = any>(
  jsonString: string,
  options: {
    fallback?: T;
    context?: string;
    schema?: (data: any) => boolean;
  } = {}
): T {
  const { fallback, context = 'JSON parsing', schema } = options;

  if (!jsonString || typeof jsonString !== 'string') {
    logger.error('Invalid JSON input', undefined, {
      context,
      type: typeof jsonString,
      value: String(jsonString).substring(0, 100)
    });

    if (fallback !== undefined) {
      return fallback;
    }

    throw new AIServiceError(
      `Invalid JSON response from AI service: Expected string, got ${typeof jsonString}`,
      500
    );
  }

  try {
    // Clean common JSON formatting issues from AI responses
    let cleaned = jsonString.trim();

    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

    // Remove leading/trailing text outside of JSON object/array
    const jsonStart = cleaned.search(/[{[]/);
    const jsonEnd = cleaned.search(/[}\]]\s*$/);
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(cleaned) as T;

    // Validate against schema if provided
    if (schema && !schema(parsed)) {
      logger.error('JSON validation failed against schema', undefined, {
        context,
        parsedData: JSON.stringify(parsed).substring(0, 200)
      });

      if (fallback !== undefined) {
        return fallback;
      }

      throw new AIServiceError(
        'AI response does not match expected schema',
        500
      );
    }

    return parsed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('JSON parsing failed', error instanceof Error ? error : undefined, {
      context,
      jsonString: jsonString.substring(0, 200),
      error: errorMessage
    });

    if (fallback !== undefined) {
      logger.warn('Using fallback value due to JSON parsing failure', {
        context
      });
      return fallback;
    }

    throw new AIServiceError(
      `Failed to parse AI response: ${errorMessage}. The AI service may have returned invalid JSON.`,
      500
    );
  }
}

/**
 * Validates that parsed JSON contains required fields
 */
export function validateJSONFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[],
  context: string = 'JSON validation'
): T {
  const missingFields = requiredFields.filter(field => !(field in data));

  if (missingFields.length > 0) {
    logger.error('Missing required fields in JSON response', undefined, {
      context,
      missingFields: missingFields.map(String),
      receivedFields: Object.keys(data)
    });

    throw new AIServiceError(
      `AI response missing required fields: ${missingFields.join(', ')}`,
      500
    );
  }

  return data;
}

/**
 * Attempts to extract JSON from potentially mixed content
 */
export function extractJSON<T = any>(
  content: string,
  options: {
    fallback?: T;
    context?: string;
  } = {}
): T | null {
  const { fallback, context = 'JSON extraction' } = options;

  try {
    // Try to find JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return safeJSONParse<T>(jsonMatch[0], { fallback, context });
    }

    logger.warn('No JSON found in content', {
      context,
      content: content.substring(0, 200)
    });

    return fallback ?? null;
  } catch (error) {
    logger.error('Failed to extract JSON from content', error instanceof Error ? error : undefined, {
      context
    });

    return fallback ?? null;
  }
}

/**
 * Type-safe JSON stringification with error handling
 */
export function safeJSONStringify(
  data: any,
  options: {
    pretty?: boolean;
    maxLength?: number;
  } = {}
): string {
  const { pretty = false, maxLength } = options;

  try {
    const stringified = JSON.stringify(
      data,
      null,
      pretty ? 2 : undefined
    );

    if (maxLength && stringified.length > maxLength) {
      logger.warn('JSON stringified output exceeds max length', {
        actualLength: stringified.length,
        maxLength
      });
      return stringified.substring(0, maxLength);
    }

    return stringified;
  } catch (error) {
    logger.error('JSON stringification failed', error instanceof Error ? error : undefined);
    return '{}';
  }
}
