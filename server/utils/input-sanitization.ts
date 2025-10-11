import { logger } from '../logger';

/**
 * Sanitizes user input to prevent XSS, SQL injection, and other security vulnerabilities
 */
export function sanitizeInput(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  fieldName?: string;
} = {}): string {
  const {
    maxLength = 10000,
    allowHtml = false,
    fieldName = 'input'
  } = options;

  if (typeof input !== 'string') {
    logger.warn('Non-string input received for sanitization', {
      fieldName,
      type: typeof input
    });
    return String(input).substring(0, maxLength);
  }

  let sanitized = input.trim();

  // Enforce maximum length
  if (sanitized.length > maxLength) {
    logger.warn('Input exceeded maximum length', {
      fieldName,
      originalLength: sanitized.length,
      maxLength
    });
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // If HTML is not allowed, escape HTML entities
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Remove potentially dangerous characters for SQL injection
  // Note: Parameterized queries should be used, but this adds defense in depth
  sanitized = sanitized.replace(/;--/g, '');
  sanitized = sanitized.replace(/;\s*DROP\s+/gi, '');
  sanitized = sanitized.replace(/;\s*DELETE\s+/gi, '');
  sanitized = sanitized.replace(/;\s*INSERT\s+/gi, '');
  sanitized = sanitized.replace(/;\s*UPDATE\s+/gi, '');

  // Remove script injection attempts
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Sanitizes AI prompts to prevent prompt injection attacks
 */
export function sanitizeAIPrompt(prompt: string, maxLength: number = 5000): string {
  let sanitized = sanitizeInput(prompt, {
    maxLength,
    allowHtml: false,
    fieldName: 'ai-prompt'
  });

  // Remove common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts)/gi,
    /forget\s+(all\s+)?(your\s+)?instructions/gi,
    /disregard\s+(all\s+)?rules/gi,
    /new\s+instructions:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Log if suspicious patterns were detected
  if (sanitized.length < prompt.length * 0.9) {
    logger.warn('Potential prompt injection attempt detected and sanitized', {
      originalLength: prompt.length,
      sanitizedLength: sanitized.length,
      removedChars: prompt.length - sanitized.length
    });
  }

  return sanitized;
}

/**
 * Validates and sanitizes array inputs
 */
export function sanitizeArray(
  arr: unknown[],
  options: {
    maxItems?: number;
    itemMaxLength?: number;
    allowHtml?: boolean;
  } = {}
): string[] {
  const {
    maxItems = 100,
    itemMaxLength = 500,
    allowHtml = false
  } = options;

  if (!Array.isArray(arr)) {
    logger.warn('Non-array input received for array sanitization');
    return [];
  }

  return arr
    .slice(0, maxItems)
    .filter(item => typeof item === 'string' || typeof item === 'number')
    .map(item => sanitizeInput(String(item), { maxLength: itemMaxLength, allowHtml }));
}

/**
 * Sanitizes object properties recursively
 */
export function sanitizeObject(
  obj: Record<string, any>,
  options: {
    maxDepth?: number;
    allowHtml?: boolean;
  } = {},
  currentDepth: number = 0
): Record<string, any> {
  const { maxDepth = 5, allowHtml = false } = options;

  if (currentDepth >= maxDepth) {
    logger.warn('Maximum object depth reached during sanitization');
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInput(key, { maxLength: 100, allowHtml: false });

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeInput(value, { allowHtml });
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeArray(value, { allowHtml });
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value, options, currentDepth + 1);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (value === null) {
      sanitized[sanitizedKey] = null;
    }
  }

  return sanitized;
}
