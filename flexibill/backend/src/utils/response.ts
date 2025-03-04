import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

export class APIResponse {
  static success<T>(
    res: Response,
    data: T,
    meta?: SuccessResponse<T>['meta'],
    status: number = 200
  ): Response {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
    };
    return res.status(status).json(response);
  }

  static error(
    res: Response,
    message: string,
    code: string = 'INTERNAL_ERROR',
    status: number = 500,
    details?: any
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        message,
        code,
        ...(details && { details }),
      },
    };
    return res.status(status).json(response);
  }

  static created<T>(res: Response, data: T, meta?: SuccessResponse<T>['meta']): Response {
    return this.success(res, data, meta, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(
    res: Response,
    message: string = 'Invalid request',
    code: string = 'VALIDATION_ERROR',
    details?: any
  ): Response {
    return this.error(res, message, code, 400, details);
  }

  static unauthorized(
    res: Response,
    message: string = 'Authentication required',
    code: string = 'AUTHENTICATION_ERROR'
  ): Response {
    return this.error(res, message, code, 401);
  }

  static forbidden(
    res: Response,
    message: string = 'Access denied',
    code: string = 'AUTHORIZATION_ERROR'
  ): Response {
    return this.error(res, message, code, 403);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    code: string = 'NOT_FOUND'
  ): Response {
    return this.error(res, message, code, 404);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    code: string = 'CONFLICT'
  ): Response {
    return this.error(res, message, code, 409);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Rate limit exceeded',
    code: string = 'RATE_LIMIT_EXCEEDED'
  ): Response {
    return this.error(res, message, code, 429);
  }

  static internalError(
    res: Response,
    message: string = 'Internal server error',
    code: string = 'INTERNAL_ERROR'
  ): Response {
    return this.error(res, message, code, 500);
  }
}