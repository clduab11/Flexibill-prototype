import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../db/DatabaseService';
import { User } from '../entities/user.entity';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
      refreshToken?: string;
      tokenFamily?: string;
    }
  }
}

/**
 * Authentication middleware that validates JWT tokens and attaches the user to the request
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
        data: null
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Get the refresh token if provided
    const refreshToken = req.headers['x-refresh-token'] as string;
    
    // Get instances of services
    const db = DatabaseService.getInstance();
    const authService = new AuthService(db.getClient());
    
    // Validate the token
    const tokenValidationResult = await authService.validateSession(token);
    if (!tokenValidationResult.isValid) {
      // If token is expired and refresh token is provided, try to refresh
      if (tokenValidationResult.isExpired && refreshToken) {
        try {
          const newSession = await authService.refreshToken(refreshToken);
          
          // Return new token in response headers
          res.setHeader('X-New-Access-Token', newSession.access_token);
          res.setHeader('X-New-Refresh-Token', newSession.refresh_token);
          
          // Continue with the new token
          const { data: { user: supabaseUser }, error } = await db.getClient().auth.getUser(newSession.access_token);
          
          if (error || !supabaseUser) {
            return res.status(401).json({
              success: false,
              message: 'Failed to retrieve user information after token refresh.',
              data: null
            });
          }
          
          // Fetch the complete user data
          const { data: userData, error: userError } = await db.users()
            .select('*')
            .eq('id', supabaseUser.id)
            .single();
            
          if (userError || !userData) {
            return res.status(401).json({
              success: false,
              message: 'User not found in the database.',
              data: null
            });
          }
          
          // Attach user and new tokens to request
          req.user = userData as User;
          req.token = newSession.access_token;
          req.refreshToken = newSession.refresh_token;
          next();
          return;
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please login again.',
            data: null
          });
        }
      }
      
      return res.status(401).json({
        success: false,
        message: tokenValidationResult.isExpired 
          ? 'Your session has expired. Please login again.' 
          : 'Invalid token. Please login again.',
        data: null
      });
    }
    
    // Get user data from the token
    const { data: { user: supabaseUser }, error } = await db.getClient().auth.getUser(token);
    
    if (error || !supabaseUser) {
      return res.status(401).json({
        success: false,
        message: 'Failed to retrieve user information.',
        data: null
      });
    }
    
    // Fetch the complete user data from the database
    const { data: userData, error: userError } = await db.users()
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
      
    if (userError || !userData) {
      return res.status(401).json({
        success: false,
        message: 'User not found in the database.',
        data: null
      });
    }

    // Attach user and token to request
    req.user = userData as User;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
      data: null
    });
  }
};
