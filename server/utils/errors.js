/**
 * Standardized Error Response System
 * Provides consistent error handling across the API
 */
export var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCode["TWO_FACTOR_REQUIRED"] = "TWO_FACTOR_REQUIRED";
    // Validation
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["MISSING_FIELD"] = "MISSING_FIELD";
    // Resources
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    ErrorCode["CONFLICT"] = "CONFLICT";
    // Business Logic
    ErrorCode["INSUFFICIENT_INVENTORY"] = "INSUFFICIENT_INVENTORY";
    ErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    ErrorCode["SUBSCRIPTION_REQUIRED"] = "SUBSCRIPTION_REQUIRED";
    ErrorCode["LIMIT_EXCEEDED"] = "LIMIT_EXCEEDED";
    // System
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // File Operations
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ErrorCode["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCode["VIRUS_DETECTED"] = "VIRUS_DETECTED";
    ErrorCode["UPLOAD_FAILED"] = "UPLOAD_FAILED";
})(ErrorCode || (ErrorCode = {}));
export class AppError extends Error {
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
export function sendError(res, error, requestId, path) {
    if (error instanceof AppError) {
        const response = {
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
    }
    else {
        const response = {
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
    unauthorized: (message = 'Authentication required') => new AppError(ErrorCode.UNAUTHORIZED, message, 401),
    forbidden: (message = 'Insufficient permissions') => new AppError(ErrorCode.FORBIDDEN, message, 403),
    notFound: (resource) => new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),
    validation: (details) => new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, details),
    conflict: (message) => new AppError(ErrorCode.CONFLICT, message, 409),
    accountLocked: (until) => new AppError(ErrorCode.ACCOUNT_LOCKED, `Account locked${until ? ` until ${until.toISOString()}` : ''}`, 423),
    rateLimitExceeded: (retryAfter) => new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many requests', 429, retryAfter ? [{ message: `Retry after ${retryAfter} seconds` }] : undefined),
    paymentFailed: (message) => new AppError(ErrorCode.PAYMENT_FAILED, message, 402),
    insufficientInventory: (product, available) => new AppError(ErrorCode.INSUFFICIENT_INVENTORY, `Insufficient inventory for ${product}`, 400, [{ message: `Only ${available} units available` }]),
    serviceUnavailable: (service) => new AppError(ErrorCode.SERVICE_UNAVAILABLE, `${service} is temporarily unavailable`, 503),
};
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
export function zodErrorToDetails(error) {
    if (!error.errors)
        return [];
    return error.errors.map((err) => ({
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
    constructor(message, provider, failures) {
        super(message);
        this.provider = provider;
        this.failures = failures;
        this.name = 'AIProviderError';
    }
}
export class DatabaseError extends Error {
    constructor(message, query) {
        super(message);
        this.query = query;
        this.name = 'DatabaseError';
    }
}
export class EmailError extends Error {
    constructor(message, errorMessage, userId) {
        super(message);
        this.errorMessage = errorMessage;
        this.userId = userId;
        this.name = 'EmailError';
    }
}
export class OAuthError extends Error {
    constructor(message, provider, userId) {
        super(message);
        this.provider = provider;
        this.userId = userId;
        this.name = 'OAuthError';
    }
}
export class BackupError extends Error {
    constructor(message, errorMessage, backupPath) {
        super(message);
        this.errorMessage = errorMessage;
        this.backupPath = backupPath;
        this.name = 'BackupError';
    }
}
