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
    
    // Get instances of services
    const db = DatabaseService.getInstance();
    const authService = new AuthService(db.getClient());
    
    // Validate the token
    const isValid = await authService.validateSession(token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
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
