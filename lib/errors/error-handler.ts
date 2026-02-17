/**
 * Error Handler Middleware and Utilities
 * 
 * Provides centralized error handling for API routes with:
 * - Consistent error response formatting
 * - Request ID tracking
 * - Error logging with context
 * - Async handler wrapper for clean error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './custom-errors';
import { ErrorResponse, ErrorContext } from './error-types';
import { logger } from '../logger';
import { randomUUID } from 'crypto';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
    return `req_${randomUUID().substring(0, 8)}`;
}

/**
 * Extract error context from request
 */
export function extractErrorContext(
    request: NextRequest,
    requestId: string,
    userId?: string,
    tenantId?: string
): ErrorContext {
    return {
        userId,
        tenantId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        requestId,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };
}

/**
 * Format error response with consistent structure
 */
export function formatErrorResponse(
    error: Error,
    requestId: string,
    isDevelopment: boolean = process.env.NODE_ENV !== 'production'
): ErrorResponse {
    // Handle AppError instances
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                message: error.message,
                code: error.errorCode,
                statusCode: error.statusCode,
                requestId,
                timestamp: new Date().toISOString(),
                // Only include details in development or for operational errors
                details: (isDevelopment || error.isOperational) ? error.details : undefined,
            },
        };
    }

    // Handle generic errors (don't expose internal details in production)
    return {
        success: false,
        error: {
            message: isDevelopment ? error.message : 'An unexpected error occurred',
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            requestId,
            timestamp: new Date().toISOString(),
            // Only include stack trace in development
            details: isDevelopment ? { stack: error.stack } : undefined,
        },
    };
}

/**
 * Log error with context
 */
export function logError(error: Error, context: ErrorContext): void {
    const logContext: Record<string, any> = {
        ...context,
        errorName: error.name,
        errorMessage: error.message,
    };

    // Add stack trace for non-operational errors or in development
    if (error instanceof AppError) {
        if (!error.isOperational || process.env.NODE_ENV !== 'production') {
            logContext.stack = error.stack;
        }
        logContext.errorCode = error.errorCode;
        logContext.statusCode = error.statusCode;
        logContext.isOperational = error.isOperational;
    } else {
        logContext.stack = error.stack;
    }

    logger.error('API Error', logContext);
}

/**
 * Handle API errors and return formatted response
 */
export function handleApiError(
    error: unknown,
    request: NextRequest,
    userId?: string,
    tenantId?: string
): NextResponse {
    const requestId = generateRequestId();
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Convert unknown error to Error instance
    const errorInstance = error instanceof Error ? error : new Error(String(error));

    // Extract context and log error
    const context = extractErrorContext(request, requestId, userId, tenantId);
    logError(errorInstance, context);

    // Format error response
    const errorResponse = formatErrorResponse(errorInstance, requestId, isDevelopment);

    // Return response with appropriate status code
    const statusCode = errorInstance instanceof AppError ? errorInstance.statusCode : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Async handler wrapper for API routes
 * Automatically catches errors and passes them to the error handler
 * 
 * Usage:
 * export const GET = asyncHandler(async (request: NextRequest) => {
 *   // Your route logic here
 *   // Throw custom errors as needed
 *   throw new UnauthorizedError('User not authenticated');
 * });
 */
export function asyncHandler(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
        try {
            return await handler(request, context);
        } catch (error) {
            // Try to extract user/tenant info from request if available
            // This is a best-effort attempt - routes can pass this explicitly if needed
            return handleApiError(error, request);
        }
    };
}

/**
 * Async handler with user context
 * Similar to asyncHandler but extracts user info for better error logging
 * 
 * Usage:
 * export const GET = asyncHandlerWithAuth(async (request: NextRequest, user: User) => {
 *   // Your route logic here with authenticated user
 * });
 */
export function asyncHandlerWithAuth(
    handler: (request: NextRequest, user: any, context?: any) => Promise<NextResponse>,
    getUserFn: (request: NextRequest) => Promise<any>
) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
        try {
            const user = await getUserFn(request);
            return await handler(request, user, context);
        } catch (error) {
            // Extract user info if available
            let userId: string | undefined;
            let tenantId: string | undefined;

            try {
                const user = await getUserFn(request);
                userId = user?.id;
                tenantId = user?.tenantId;
            } catch {
                // User extraction failed, continue without user context
            }

            return handleApiError(error, request, userId, tenantId);
        }
    };
}
