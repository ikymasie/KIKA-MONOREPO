/**
 * Error Response Types
 * 
 * Defines TypeScript interfaces for structured error responses
 * and error context for logging.
 */

/**
 * Structured error response format
 * All API errors should follow this format for consistency
 */
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        statusCode: number;
        requestId: string;
        timestamp: string;
        details?: any;
    };
}

/**
 * Success response format
 * All API success responses should follow this format
 */
export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    requestId?: string;
    timestamp?: string;
}

/**
 * Error context for logging
 * Captures relevant information about the request and user
 */
export interface ErrorContext {
    userId?: string;
    tenantId?: string;
    endpoint: string;
    method: string;
    requestId: string;
    userAgent?: string;
    ip?: string;
}

/**
 * Error codes for different error types
 */
export enum ErrorCode {
    // Client errors (4xx)
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    BAD_REQUEST = 'BAD_REQUEST',

    // Server errors (5xx)
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

    // Custom errors
    TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
    MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
    LOAN_NOT_FOUND = 'LOAN_NOT_FOUND',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
}
