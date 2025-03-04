export class APIError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class PlaidError extends APIError {
  constructor(message: string, code: string = 'PLAID_ERROR') {
    super(message, 502, code);
  }
}

export class DatabaseError extends APIError {
  constructor(message: string) {
    super(message, 503, 'DATABASE_ERROR');
  }
}

export class AzureOpenAIError extends APIError {
  constructor(message: string) {
    super(message, 502, 'AZURE_OPENAI_ERROR');
  }
}

// Error middleware
export const errorHandler = (error: Error, req: any, res: any, next: any) => {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error instanceof APIError && {
      status: error.status,
      code: error.code,
    }),
  });

  if (error instanceof APIError) {
    return res.status(error.status).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};