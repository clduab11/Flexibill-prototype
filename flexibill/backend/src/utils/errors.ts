export class APIError extends Error {
  status: number;
  code: string;
  details?: any;
  cause?: Error;

  constructor(
    message: string, 
    status: number = 500, 
    code: string = 'INTERNAL_ERROR',
    details?: any,
    options?: { cause?: Error }
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.cause = options?.cause;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert the error to a plain object for serialization/logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message
      } : undefined
    };
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 400, 'VALIDATION_ERROR', details, options);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', details?: any, options?: { cause?: Error }) {
    super(message, 401, 'AUTHENTICATION_ERROR', details, options);
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied', details?: any, options?: { cause?: Error }) {
    super(message, 403, 'AUTHORIZATION_ERROR', details, options);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 404, 'NOT_FOUND', details, options);
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 409, 'CONFLICT', details, options);
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded', details?: any, options?: { cause?: Error }) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details, options);
  }
}

export class PlaidError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 502, 'PLAID_ERROR', details, options);
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 503, 'DATABASE_ERROR', details, options);
  }
}

export class AzureOpenAIError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 502, 'AZURE_OPENAI_ERROR', details, options);
  }
}

// Additional error types for more specific error handling
export class BadRequestError extends APIError {
  constructor(message: string, details?: any, options?: { cause?: Error }) {
    super(message, 400, 'BAD_REQUEST', details, options);
  }
}

export class ServiceUnavailableError extends APIError {
  constructor(message: string = 'Service temporarily unavailable', details?: any, options?: { cause?: Error }) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details, options);
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timed out', details?: any, options?: { cause?: Error }) {
    super(message, 504, 'TIMEOUT', details, options);
  }
}

// Import error middleware from dedicated file
import { globalErrorHandler } from '../middleware/errorMiddleware';
export { globalErrorHandler };