import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../db/DatabaseService';
import { APIResponse } from '../utils/response';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();
const db = DatabaseService.getInstance();
const authService = new AuthService(db.getClient());

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return APIResponse.badRequest(
          res, 
          'Validation error', 
          'VALIDATION_ERROR', 
          errors.array()
        );
      }

      const { email, password, firstName, lastName } = req.body;

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      return APIResponse.created(res, {
        user: result.user,
        token: result.session.access_token,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        return APIResponse.conflict(res, 'Email already registered');
      }
      
      return APIResponse.error(
        res, 
        'Registration failed', 
        'REGISTRATION_ERROR', 
        500, 
        error.message
      );
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return APIResponse.badRequest(
          res, 
          'Validation error', 
          'VALIDATION_ERROR', 
          errors.array()
        );
      }

      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return APIResponse.success(res, {
        user: result.user,
        token: result.session.access_token,
        refreshToken: result.session.refresh_token,
        expiresAt: result.session.expires_at,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Invalid login credentials')) {
        return APIResponse.unauthorized(res, 'Invalid email or password');
      }
      
      return APIResponse.error(
        res, 
        'Login failed', 
        'LOGIN_ERROR', 
        500, 
        error.message
      );
    }
  }
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh the access token
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return APIResponse.badRequest(
          res, 
          'Validation error', 
          'VALIDATION_ERROR', 
          errors.array()
        );
      }

      const { refreshToken } = req.body;

      const session = await authService.refreshToken(refreshToken);

      return APIResponse.success(res, {
        token: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
      });
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return APIResponse.unauthorized(res, 'Failed to refresh token');
    }
  }
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return APIResponse.badRequest(
          res, 
          'Validation error', 
          'VALIDATION_ERROR', 
          errors.array()
        );
      }

      const { email } = req.body;

      await authService.sendPasswordResetEmail(email);

      return APIResponse.success(res, { 
        message: 'Password reset email sent' 
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      // Don't reveal if the email exists or not for security reasons
      return APIResponse.success(res, { 
        message: 'If the email exists, a password reset link has been sent' 
      });
    }
  }
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password',
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return APIResponse.badRequest(
          res, 
          'Validation error', 
          'VALIDATION_ERROR', 
          errors.array()
        );
      }

      const { password } = req.body;

      await authService.updatePassword(password);

      return APIResponse.success(res, { 
        message: 'Password reset successfully' 
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      return APIResponse.badRequest(
        res, 
        'Failed to reset password', 
        'PASSWORD_RESET_ERROR', 
        error.message
      );
    }
  }
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateUser, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return APIResponse.unauthorized(res, 'Not authenticated');
    }

    return APIResponse.success(res, { user: req.user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return APIResponse.internalError(
      res, 
      'Failed to retrieve user profile', 
      'PROFILE_ERROR'
    );
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  authenticateUser,
  [
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return APIResponse.badRequest(
          res, 
          'Validation error', 
          'VALIDATION_ERROR', 
          errors.array()
        );
      }

      if (!req.user) {
        return APIResponse.unauthorized(res, 'Not authenticated');
      }

      const { firstName, lastName } = req.body;

      const updatedUser = await authService.updateUserProfile(req.user.id, {
        firstName,
        lastName,
      });

      return APIResponse.success(res, { user: updatedUser });
    } catch (error: any) {
      console.error('Update profile error:', error);
      return APIResponse.internalError(
        res, 
        'Failed to update profile', 
        'PROFILE_UPDATE_ERROR'
      );
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout a user and invalidate their tokens
 * @access Private
 */
router.post('/logout', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { user, token, refreshToken } = req;
    
    if (!user) {
      return APIResponse.unauthorized(res, 'User not authenticated');
    }
    
    const currentRefreshToken = refreshToken || req.body.refreshToken;
    
    if (!currentRefreshToken) {
      return APIResponse.badRequest(res, 'Refresh token is required');
    }
    
    await authService.logout(currentRefreshToken, user.id);
    
    return APIResponse.success(res, { message: 'Logout successful' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return APIResponse.error(
      res, 
      'Logout failed', 
      'LOGOUT_ERROR', 
      500, 
      error.message
    );
  }
});

export default router;
