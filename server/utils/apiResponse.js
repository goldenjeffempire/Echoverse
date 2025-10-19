export function successResponse(res, data, message, statusCode = 200) {
    const response = {
        success: true,
        data,
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
}
export function paginatedResponse(res, data, pagination, message, statusCode = 200) {
    const { limit, offset, totalCount } = pagination;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalCount / limit);
    const meta = {
        page: currentPage,
        limit,
        totalCount,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
    const response = {
        success: true,
        data,
        meta,
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
}
export function errorResponse(res, message, statusCode = 500, code, details) {
    const response = {
        success: false,
        error: {
            message,
            code,
            details,
        },
    };
    res.status(statusCode).json(response);
}
export function validationErrorResponse(res, errors) {
    errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
}
export function notFoundResponse(res, resource = 'Resource') {
    errorResponse(res, `${resource} not found`, 404, 'NOT_FOUND');
}
export function unauthorizedResponse(res, message = 'Unauthorized') {
    errorResponse(res, message, 401, 'UNAUTHORIZED');
}
export function forbiddenResponse(res, message = 'Forbidden') {
    errorResponse(res, message, 403, 'FORBIDDEN');
}
export function calculatePagination(limit, offset) {
    const safeLimit = Math.max(1, Math.min(limit || 20, 100)); // Default 20, max 100
    const safeOffset = Math.max(0, offset || 0);
    const page = Math.floor(safeOffset / safeLimit) + 1;
    return {
        page,
        limit: safeLimit,
        offset: safeOffset,
    };
}
