# Error Handling System

## Overview

This directory contains the centralized error handling system for the KIKA platform. It provides consistent error responses, proper HTTP status codes, request tracking, and comprehensive error logging.

## Components

### Custom Error Classes (`custom-errors.ts`)

Provides a hierarchy of error classes for different error scenarios:

**Base Error:**
- `AppError` - Base class for all application errors

**Client Errors (4xx):**
- `BadRequestError` - 400 Bad Request
- `ValidationError` - 400 Validation Failed
- `UnauthorizedError` - 401 Authentication Required
- `InvalidCredentialsError` - 401 Invalid Credentials
- `SessionExpiredError` - 401 Session Expired
- `ForbiddenError` - 403 Access Forbidden
- `InsufficientPermissionsError` - 403 Insufficient Permissions
- `NotFoundError` - 404 Resource Not Found
- `TenantNotFoundError` - 404 Tenant Not Found
- `MemberNotFoundError` - 404 Member Not Found
- `LoanNotFoundError` - 404 Loan Not Found
- `ConflictError` - 409 Resource Conflict

**Server Errors (5xx):**
- `InternalServerError` - 500 Internal Server Error
- `DatabaseError` - 500 Database Operation Failed
- `ExternalServiceError` - 502 External Service Unavailable

### Error Handler (`error-handler.ts`)

Provides utilities for handling errors in API routes:

- `formatErrorResponse()` - Format errors into consistent response structure
- `logError()` - Log errors with context
- `handleApiError()` - Handle errors and return formatted response
- `asyncHandler()` - Wrapper for async route handlers
- `asyncHandlerWithAuth()` - Wrapper with user context extraction

### Error Types (`error-types.ts`)

TypeScript interfaces for type safety:

- `ErrorResponse` - Structured error response format
- `SuccessResponse` - Structured success response format
- `ErrorContext` - Error logging context
- `ErrorCode` - Enum of error codes

## Usage

### Basic Usage

```typescript
import { asyncHandler, UnauthorizedError, NotFoundError } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }
    
    const resource = await findResource(id);
    
    if (!resource) {
        throw new NotFoundError('Resource not found');
    }
    
    return NextResponse.json({
        success: true,
        data: resource
    });
});
```

### With User Context

```typescript
import { asyncHandlerWithAuth, ForbiddenError } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth-server';

export const GET = asyncHandlerWithAuth(
    async (request: NextRequest, user: User) => {
        if (!user.isTenantAdmin()) {
            throw new ForbiddenError('Admin access required');
        }
        
        // Your logic here
        return NextResponse.json({ success: true, data: result });
    },
    getUserFromRequest
);
```

### Validation Errors

```typescript
import { ValidationError } from '@/lib/errors';

const data = await request.json();

if (!data.email || !data.password) {
    throw new ValidationError('Email and password are required', {
        fields: {
            email: !data.email ? 'Email is required' : undefined,
            password: !data.password ? 'Password is required' : undefined,
        }
    });
}
```

### Database Errors

```typescript
import { DatabaseError } from '@/lib/errors';

try {
    await repository.save(entity);
} catch (error) {
    throw new DatabaseError('Failed to save entity', {
        originalError: error.message
    });
}
```

## Error Response Format

All errors follow this consistent format:

```json
{
  "success": false,
  "error": {
    "message": "User not authenticated",
    "code": "UNAUTHORIZED",
    "statusCode": 401,
    "requestId": "req_abc12345",
    "timestamp": "2026-02-17T20:39:56Z",
    "details": {
      // Optional additional details (only in development or for operational errors)
    }
  }
}
```

## Success Response Format

For consistency, success responses should follow this format:

```json
{
  "success": true,
  "data": {
    // Your response data
  }
}
```

## Error Logging

Errors are automatically logged with context:

```json
{
  "timestamp": "2026-02-17T20:39:56Z",
  "level": "ERROR",
  "message": "API Error",
  "userId": "user_123",
  "tenantId": "tenant_456",
  "endpoint": "/api/admin/loans",
  "method": "GET",
  "requestId": "req_abc12345",
  "errorName": "UnauthorizedError",
  "errorMessage": "User not authenticated",
  "errorCode": "UNAUTHORIZED",
  "statusCode": 401,
  "isOperational": true
}
```

## Best Practices

1. **Use Specific Error Classes:** Choose the most specific error class for your scenario
2. **Provide Context:** Include relevant details in the error details object
3. **Don't Expose Sensitive Data:** Never include passwords, tokens, or sensitive data in error details
4. **Use Async Handlers:** Always wrap route handlers with `asyncHandler` or `asyncHandlerWithAuth`
5. **Log Appropriately:** The system automatically logs errors, but you can add additional context
6. **Return Success Responses:** Use the consistent success response format

## Migration Guide

### Before

```typescript
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Logic here
        
        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

### After

```typescript
import { asyncHandler, UnauthorizedError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }
    
    // Logic here
    
    return NextResponse.json({ success: true, data: result });
});
```

## Error Codes

See `error-types.ts` for the complete list of error codes. Common codes include:

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access forbidden
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service unavailable

## Future Enhancements

- Integration with error monitoring services (Sentry, DataDog)
- Error analytics and reporting
- Automated error recovery strategies
- Rate limiting for error responses
- Custom error pages for different error types
