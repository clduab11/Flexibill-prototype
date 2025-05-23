import { Request, Response, NextFunction } from 'express';
import { APIError } from '../utils/errors';

// Centralized error logging function
function logError(error: any, req: Request) {
  // Create a structured error log with important request details
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id || 'unauthenticated',
    error: {
      name: error.name,
      message: error.message,
      code: error instanceof APIError ? error.code : 'UNKNOWN_ERROR',
      status: error instanceof APIError ? error.status : 500,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    },
    // Include partial request data for debugging (exclude sensitive info)
    request: {
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        cookie: req.headers.cookie ? '[REDACTED]' : undefined
      },
      query: req.query,
      // Don't include body to avoid logging sensitive data
      body: process.env.NODE_ENV === 'production' ? '[REDACTED]' : filterSensitiveData(req.body)
    }
  };

  // Log error details
  console.error('API Error:', JSON.stringify(errorLog));
}

// Filter sensitive data from request body
function filterSensitiveData(body: any): any {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'ssn'];
  const filtered = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in filtered) {
      filtered[field] = '[REDACTED]';
    }
  }
  
  return filtered;
}

/**
 * Global error handler middleware
 * Standardizes error responses across the API
 */
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error with request details
  logError(error, req);

  // Handle API errors
  if (error instanceof APIError) {
    return res.status(error.status).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    });
  }
  
  // Handle validation errors from express-validator
  if (error.array && typeof error.array === 'function') {
    const validationErrors = error.array();
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      }
    });
  }
  
  // Handle Supabase errors
  if (error.code && error.code.startsWith('P')) {
    const dbErrorMessage = error.message || 'Database error';
    return res.status(500).json({
      success: false,
      error: {
        message: dbErrorMessage,
        code: 'DATABASE_ERROR',
        details: {
          code: error.code,
          hint: error.hint
        }
      }
    });
  }

  // Handle known Node.js errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        details: {
          service: error.address
        }
      }
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message || 'Unknown error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
}

/**
 * Handle 404 errors for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}

/**
 * Request validation middleware factory
 * @param validate validation function using express-validator
 */
export function validateRequest(validate: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await validate(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}