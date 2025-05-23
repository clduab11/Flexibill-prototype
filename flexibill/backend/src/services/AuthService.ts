import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserData, Subscription, SubscriptionStatus } from '../entities/user.entity';
import { DatabaseService } from '../db/DatabaseService';
import { TokenService } from './TokenService';

interface UserRegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface UserProfileData {
  firstName?: string;
  lastName?: string;
  subscription?: Subscription;
  subscriptionStatus?: SubscriptionStatus;
}

interface AuthResult {
  user: UserData;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  userId?: string;
  error?: string;
}

export class AuthService {
  private supabase: SupabaseClient;
  private db: DatabaseService;
  private tokenService: TokenService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.db = DatabaseService.getInstance();
    this.tokenService = new TokenService(supabase);
  }

  /**
   * Register a new user with Supabase Auth and create a user profile
   * @param userData User registration data including email, password, and optional profile info
   * @returns The created user and session
   */
  async register(userData: UserRegistrationData): Promise<AuthResult> {
    // Register the user with Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) {
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Failed to create user or session');
    }

    // Create the user profile in the database
    const newUser = {
      id: data.user.id,
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      subscription: 'free' as Subscription,
      subscriptionStatus: 'active' as SubscriptionStatus,
      plaidItemIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { error: insertError } = await this.db.users().insert(newUser);

    if (insertError) {
      // If user profile creation fails, we should delete the auth user
      await this.supabase.auth.admin.deleteUser(data.user.id);
      throw insertError;
    }

    return {
      user: newUser as UserData,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0
      }
    };
  }

  /**
   * Login a user with email and password
   * @param email User email
   * @param password User password
   * @returns The user and session
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Sign in with Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    if (!data.user || !data.session) {
      throw new Error('Failed to retrieve user or session');
    }

    // Get the user profile from the database
    const { data: userData, error: userError } = await this.db.users()
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User profile not found');
    }

    // Create a new token family for this login session
    const tokenFamilyId = await this.tokenService.createTokenFamily(data.user.id);
    
    // Store metadata for the refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry for refresh token
    
    await this.tokenService.storeTokenMetadata(
      data.session.refresh_token,
      {
        userId: data.user.id,
        tokenFamily: tokenFamilyId,
        lastRefreshed: new Date(),
        expiresAt: expiresAt,
        revoked: false
      }
    );

    // Update last login timestamp
    await this.db.users()
      .update({ last_login: new Date() })
      .eq('id', data.user.id);

    return {
      user: userData as UserData,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0
      }
    };
  }

  /**
   * Validate a session token
   * @param token JWT token
   * @returns Boolean indicating if the token is valid
   */
  async validateSession(token: string): Promise<TokenValidationResult> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error) {
      return {
        isValid: false,
        isExpired: error.message.includes('expired'),
        error: error.message
      };
    }

    // Check if the user exists in our database
    if (user) {
      const { data } = await this.db.users()
        .select('id, subscriptionStatus')
        .eq('id', user.id)
        .single();
      
      if (data) {
        return {
          isValid: true,
          isExpired: false,
          userId: data.id
        };
      }
    }
    
    return {
      isValid: false,
      isExpired: false,
      error: 'User not found'
    };
  }

  /**
   * Validate a refresh token
   * @param refreshToken Refresh token to validate
   * @returns Boolean indicating if the token is valid
   */
  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    return !error && !!data.session;
  }

  /**
   * Refresh the session token
   * @returns New session data
   */
  async refreshToken(refreshToken: string): Promise<{ 
    access_token: string; 
    refresh_token: string; 
    expires_at: number 
  }> {
    // Validate the token against our database first (to check for reuse/revocation)
    const tokenMetadata = await this.tokenService.validateRefreshToken(refreshToken);
    if (!tokenMetadata) {
      throw new Error('Invalid refresh token');
    }
    
    // Check if the token family is valid
    const isTokenFamilyValid = await this.tokenService.isTokenFamilyValid(tokenMetadata.tokenFamily);
    if (!isTokenFamilyValid) {
      throw new Error('Token family has been revoked');
    }
    
    // Invalidate the current refresh token (token rotation)
    await this.tokenService.invalidateRefreshToken(refreshToken);
    
    // Get new tokens from Supabase
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      throw new Error('Failed to refresh session: ' + (error?.message || 'Session data is missing'));
    }
    
    // Store the new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry for refresh token
    
    await this.tokenService.storeTokenMetadata(
      data.session.refresh_token,
      {
        userId: tokenMetadata.userId,
        tokenFamily: tokenMetadata.tokenFamily,
        lastRefreshed: new Date(),
        expiresAt: expiresAt,
        revoked: false
      }
    );
    
    // Update the token family's last used timestamp
    await this.tokenService.updateTokenFamilyUsage(tokenMetadata.tokenFamily);

    if (!data.session) {
      throw new Error('No session returned from refresh');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at || 0
    };
  }

  /**
   * Send a password reset email
   * @param email User email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw error;
    }
  }

  /**
   * Update a user's password
   * @param newPassword New password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw error;
    }
  }

  /**
   * Update a user's profile
   * @param userId User ID
   * @param profileData Profile data to update
   * @returns Updated user
   */
  async updateUserProfile(userId: string, profileData: UserProfileData): Promise<UserData> {
    // Update the user profile in the database
    const { data, error } = await this.db.users()
      .update({
        ...profileData,
        updatedAt: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('User not found');
    }

    return data as UserData;
  }

  /**
   * Logout a user and revoke their token family
   * @param refreshToken The current refresh token
   * @param userId The user's ID
   */
  async logout(refreshToken: string, userId: string): Promise<void> {
    try {
      // Get token metadata to find the token family
      const tokenMetadata = await this.tokenService.validateRefreshToken(refreshToken);
      
      if (tokenMetadata) {
        // Revoke the entire token family
        await this.tokenService.revokeTokenFamily(tokenMetadata.tokenFamily, userId);
      }
      
      // Sign out with Supabase Auth
      await this.supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if there's an error with token revocation
    }
  }
}
