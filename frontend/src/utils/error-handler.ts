/**
 * Error Handler Utilities
 * Centralized error handling for API calls and user feedback
 */

import { AxiosError } from "axios";

export interface APIError {
    message: string;
    code?: string;
    status_code?: number;
    details?: Record<string, any>;
}

export class AppError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, any>;

    constructor(message: string, code: string = "APP_ERROR", statusCode: number = 500, details?: Record<string, any>) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
    // Axios error
    if (error instanceof AxiosError) {
        if (error.response?.data?.error?.message) {
            return error.response.data.error.message;
        }
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
    }

    // AppError
    if (error instanceof AppError) {
        return error.message;
    }

    // Standard Error
    if (error instanceof Error) {
        return error.message;
    }

    // String error
    if (typeof error === "string") {
        return error;
    }

    // Unknown error
    return "An unexpected error occurred";
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
    const message = getErrorMessage(error);

    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
        "Network Error": "Unable to connect to the server. Please check your internet connection.",
        "timeout": "The request took too long. Please try again.",
        "401": "You are not logged in. Please log in and try again.",
        "403": "You don't have permission to perform this action.",
        "404": "The requested resource was not found.",
        "422": "The data you provided is invalid. Please check and try again.",
        "500": "A server error occurred. Please try again later.",
        "503": "The service is temporarily unavailable. Please try again later.",
    };

    // Check for known errors
    for (const [key, friendlyMessage] of Object.entries(errorMap)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
            return friendlyMessage;
        }
    }

    // Return original message if no mapping found
    return message;
}

/**
 * Parse API error response
 */
export function parseAPIError(error: unknown): APIError {
    if (error instanceof AxiosError && error.response?.data?.error) {
        return error.response.data.error;
    }

    return {
        message: getErrorMessage(error),
        code: "UNKNOWN_ERROR",
        status_code: error instanceof AxiosError ? error.response?.status : undefined,
    };
}

/**
 * Log error to console (and optionally to external service)
 */
export function logError(error: unknown, context?: string) {
    const errorInfo = parseAPIError(error);

    console.error(
        `[Error${context ? ` - ${context}` : ""}]:`,
        errorInfo.message,
        {
            code: errorInfo.code,
            statusCode: errorInfo.status_code,
            details: errorInfo.details,
            originalError: error,
        }
    );

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { context },
    //     extra: errorInfo,
    //   });
    // }
}

/**
 * Handle API error with user feedback
 */
export function handleAPIError(error: unknown, context?: string): string {
    logError(error, context);
    return getUserFriendlyError(error);
}

/**
 * Retry function with exponential backoff
 */
export async function retryAsync<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (i < maxRetries - 1) {
                // Wait with exponential backoff
                await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }

    throw lastError;
}

/**
 * Validate response data
 */
export function validateResponse<T>(data: any, validator: (data: any) => data is T): T {
    if (!validator(data)) {
        throw new AppError("Invalid response data", "VALIDATION_ERROR", 422);
    }
    return data;
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    context?: string
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        logError(error, context);
        return fallback;
    }
}

// Export all
export default {
    getErrorMessage,
    getUserFriendlyError,
    parseAPIError,
    logError,
    handleAPIError,
    retryAsync,
    validateResponse,
    safeAsync,
};
