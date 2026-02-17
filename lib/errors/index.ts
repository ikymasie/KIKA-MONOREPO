/**
 * Error Handling System
 * 
 * Centralized error handling for the KIKA platform with:
 * - Custom error classes with proper HTTP status codes
 * - Structured error responses
 * - Request tracking with unique IDs
 * - Comprehensive error logging
 */

// Export all error classes
export * from './custom-errors';

// Export error types
export * from './error-types';

// Export error handler utilities
export * from './error-handler';
