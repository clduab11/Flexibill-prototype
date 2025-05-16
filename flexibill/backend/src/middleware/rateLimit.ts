import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { APIResponse } from '../utils/response';

/**
 * Rate limiter for authentication routes (login, register, password reset)
 * More strict limits to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login/register requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    return APIResponse.error(
      res, 
      'Too many login attempts, please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }
});

/**
 * General API rate limiter for all other routes
 * Less strict but prevents abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return APIResponse.error(
      res, 
      'Too many requests, please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }
});

/**
 * Rate limiter for Plaid-related routes
 * Moderate limits to prevent excessive API calls to Plaid
 */
export const plaidRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 Plaid API requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return APIResponse.error(
      res, 
      'Too many financial account requests, please try again later.',
      'PLAID_RATE_LIMIT_EXCEEDED',
      429
    );
  }
});
