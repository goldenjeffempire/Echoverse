import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  res: Response, 
  data: T, 
  message?: string, 
  statusCode: number = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: {
    limit: number;
    offset: number;
    totalCount: number;
  },
  message?: string,
  statusCode: number = 200
): void {
  const { limit, offset, totalCount } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  const meta: PaginationMeta = {
    page: currentPage,
    limit,
    totalCount,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  const response: ApiSuccessResponse<T[]> = {
    success: true,
    data,
    meta,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };

  res.status(statusCode).json(response);
}

export function validationErrorResponse(
  res: Response,
  errors: Array<Record<string, unknown>>
): void {
  errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
}

export function notFoundResponse(
  res: Response,
  resource: string = 'Resource'
): void {
  errorResponse(res, `${resource} not found`, 404, 'NOT_FOUND');
}

export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized'
): void {
  errorResponse(res, message, 401, 'UNAUTHORIZED');
}

export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden'
): void {
  errorResponse(res, message, 403, 'FORBIDDEN');
}

export function calculatePagination(limit: number, offset: number): { page: number; limit: number; offset: number } {
  const safeLimit = Math.max(1, Math.min(limit || 20, 100)); // Default 20, max 100
  const safeOffset = Math.max(0, offset || 0);
  const page = Math.floor(safeOffset / safeLimit) + 1;

  return {
    page,
    limit: safeLimit,
    offset: safeOffset,
  };
}
