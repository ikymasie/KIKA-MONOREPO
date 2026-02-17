/**
 * Structured Logger
 * 
 * Provides structured logging with proper formatting for different log levels.
 * In production, this can be extended to integrate with external logging services
 * like CloudWatch, DataDog, or ELK stack.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
    [key: string]: any;
}

class Logger {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    /**
     * Format log message with timestamp and context
     */
    private formatLog(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const logData = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...context,
        };

        return JSON.stringify(logData, null, this.isDevelopment ? 2 : 0);
    }

    /**
     * Log error messages
     */
    error(message: string, context?: LogContext): void {
        const formattedLog = this.formatLog('error', message, context);
        console.error(formattedLog);
    }

    /**
     * Log warning messages
     */
    warn(message: string, context?: LogContext): void {
        const formattedLog = this.formatLog('warn', message, context);
        console.warn(formattedLog);
    }

    /**
     * Log info messages
     */
    info(message: string, context?: LogContext): void {
        const formattedLog = this.formatLog('info', message, context);
        console.log(formattedLog);
    }

    /**
     * Log debug messages (only in development)
     */
    debug(message: string, context?: LogContext): void {
        if (this.isDevelopment) {
            const formattedLog = this.formatLog('debug', message, context);
            console.debug(formattedLog);
        }
    }

    /**
     * Log error with stack trace
     */
    errorWithStack(error: Error, context?: LogContext): void {
        this.error(error.message, {
            ...context,
            stack: error.stack,
            name: error.name,
        });
    }
}

// Export singleton instance
export const logger = new Logger();
