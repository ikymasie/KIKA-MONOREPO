/**
 * Custom Error Classes
 * 
 * Provides a hierarchy of custom error classes with proper HTTP status codes
 * and error codes for consistent error handling across the application.
 */

import { ErrorCode } from './error-types';

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number,
        errorCode: string,
        isOperational: boolean = true,
        details?: any
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly to ensure instanceof works correctly
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * 400 Bad Request
 * Used for general client-side errors
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request', details?: any) {
        super(message, 400, ErrorCode.BAD_REQUEST, true, details);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}

/**
 * 400 Validation Error
 * Used when request data fails validation
 */
export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: any) {
        super(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * 401 Unauthorized
 * Used when authentication is required but missing or invalid
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required', details?: any) {
        super(message, 401, ErrorCode.UNAUTHORIZED, true, details);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

/**
 * 401 Invalid Credentials
 * Used when login credentials are incorrect
 */
export class InvalidCredentialsError extends AppError {
    constructor(message: string = 'Invalid credentials', details?: any) {
        super(message, 401, ErrorCode.INVALID_CREDENTIALS, true, details);
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}

/**
 * 401 Session Expired
 * Used when user session has expired
 */
export class SessionExpiredError extends AppError {
    constructor(message: string = 'Session expired', details?: any) {
        super(message, 401, ErrorCode.SESSION_EXPIRED, true, details);
        Object.setPrototypeOf(this, SessionExpiredError.prototype);
    }
}

/**
 * 403 Forbidden
 * Used when user is authenticated but lacks permissions
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden', details?: any) {
        super(message, 403, ErrorCode.FORBIDDEN, true, details);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

/**
 * 403 Insufficient Permissions
 * Used when user lacks specific permissions for an action
 */
export class InsufficientPermissionsError extends AppError {
    constructor(message: string = 'Insufficient permissions', details?: any) {
        super(message, 403, ErrorCode.INSUFFICIENT_PERMISSIONS, true, details);
        Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
    }
}

/**
 * 404 Not Found
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', details?: any) {
        super(message, 404, ErrorCode.NOT_FOUND, true, details);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * 404 Tenant Not Found
 * Used when a tenant doesn't exist
 */
export class TenantNotFoundError extends AppError {
    constructor(message: string = 'Tenant not found', details?: any) {
        super(message, 404, ErrorCode.TENANT_NOT_FOUND, true, details);
        Object.setPrototypeOf(this, TenantNotFoundError.prototype);
    }
}

/**
 * 404 Member Not Found
 * Used when a member doesn't exist
 */
export class MemberNotFoundError extends AppError {
    constructor(message: string = 'Member not found', details?: any) {
        super(message, 404, ErrorCode.MEMBER_NOT_FOUND, true, details);
        Object.setPrototypeOf(this, MemberNotFoundError.prototype);
    }
}

/**
 * 404 Loan Not Found
 * Used when a loan doesn't exist
 */
export class LoanNotFoundError extends AppError {
    constructor(message: string = 'Loan not found', details?: any) {
        super(message, 404, ErrorCode.LOAN_NOT_FOUND, true, details);
        Object.setPrototypeOf(this, LoanNotFoundError.prototype);
    }
}

/**
 * 409 Conflict
 * Used when a request conflicts with current state (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict', details?: any) {
        super(message, 409, ErrorCode.CONFLICT, true, details);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', details?: any) {
        super(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, false, details);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}

/**
 * 500 Database Error
 * Used when database operations fail
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', details?: any) {
        super(message, 500, ErrorCode.DATABASE_ERROR, false, details);
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

/**
 * 502 External Service Error
 * Used when external service calls fail (SMS, email, etc.)
 */
export class ExternalServiceError extends AppError {
    constructor(message: string = 'External service unavailable', details?: any) {
        super(message, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, true, details);
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}
