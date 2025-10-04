/**
 * Standardized Error Response System
 * Provides consistent error handling across the API
 */

import type { Response } from 'express';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // File Operations
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  VIRUS_DETECTED = 'VIRUS_DETECTED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
}

export interface ErrorDetails {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails[];
    timestamp: string;
    path?: string;
    requestId?: string;
  };
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: ErrorDetails[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function sendError(
  res: Response,
  error: AppError | Error,
  requestId?: string,
  path?: string
): void {
  if (error instanceof AppError) {
    const response: ApiError = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        path,
        requestId
      }
    };
    
    res.status(error.statusCode).json(response);
  } else {
    const response: ApiError = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: process.env.NODE_ENV === 'production' 
          ? 'An internal error occurred' 
          : error.message,
        timestamp: new Date().toISOString(),
        path,
        requestId
      }
    };
    
    console.error('Unhandled error:', error);
    res.status(500).json(response);
  }
}

export const Errors = {
  unauthorized: (message = 'Authentication required') => 
    new AppError(ErrorCode.UNAUTHORIZED, message, 401),
  
  forbidden: (message = 'Insufficient permissions') => 
    new AppError(ErrorCode.FORBIDDEN, message, 403),
  
  notFound: (resource: string) => 
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),
  
  validation: (details: ErrorDetails[]) => 
    new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, details),
  
  conflict: (message: string) => 
    new AppError(ErrorCode.CONFLICT, message, 409),
  
  accountLocked: (until?: Date) => 
    new AppError(
      ErrorCode.ACCOUNT_LOCKED, 
      `Account locked${until ? ` until ${until.toISOString()}` : ''}`, 
      423
    ),
  
  rateLimitExceeded: (retryAfter?: number) => 
    new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED, 
      'Too many requests', 
      429, 
      retryAfter ? [{ message: `Retry after ${retryAfter} seconds` }] : undefined
    ),
  
  paymentFailed: (message: string) => 
    new AppError(ErrorCode.PAYMENT_FAILED, message, 402),
  
  insufficientInventory: (product: string, available: number) => 
    new AppError(
      ErrorCode.INSUFFICIENT_INVENTORY, 
      `Insufficient inventory for ${product}`, 
      400,
      [{ message: `Only ${available} units available` }]
    ),
  
  serviceUnavailable: (service: string) => 
    new AppError(
      ErrorCode.SERVICE_UNAVAILABLE, 
      `${service} is temporarily unavailable`, 
      503
    ),
};

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function zodErrorToDetails(error: any): ErrorDetails[] {
  if (!error.errors) return [];
  
  return error.errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
}

export class APIKeyMissingError extends AppError {
  constructor(message = 'AI provider API key is missing or invalid') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'APIKeyMissingError';
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'AI provider quota exceeded') {
    super(ErrorCode.LIMIT_EXCEEDED, message, 429);
    this.name = 'QuotaExceededError';
  }
}

export class AIServiceError extends AppError {
  constructor(message = 'AI service encountered an error', statusCode = 503) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, statusCode);
    this.name = 'AIServiceError';
  }
}

export class AIProviderError extends Error {
  constructor(message: string, public provider?: string, public failures?: any) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public query?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class EmailError extends Error {
  constructor(message: string, public errorMessage?: string, public userId?: string) {
    super(message);
    this.name = 'EmailError';
  }
}

export class OAuthError extends Error {
  constructor(message: string, public provider?: string, public userId?: string) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class BackupError extends Error {
  constructor(message: string, public errorMessage?: string, public backupPath?: string) {
    super(message);
    this.name = 'BackupError';
  }
}
