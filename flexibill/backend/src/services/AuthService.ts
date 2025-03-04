import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserData, Subscription, SubscriptionStatus } from '../entities/user.entity';
import { DatabaseService } from '../db/DatabaseService';

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

export class AuthService {
  private supabase: SupabaseClient;
  private db: DatabaseService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.db = DatabaseService.getInstance();
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
  async validateSession(token: string): Promise<boolean> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error) {
      return false;
    }

    // Check if the user exists in our database
    if (user) {
      const { data } = await this.db.users()
        .select('id')
        .eq('id', user.id)
        .single();
      
      return !!data;
    }
    
    return false;
  }

  /**
   * Refresh the session token
   * @returns New session data
   */
  async refreshToken(): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('Failed to refresh session');
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
   * Logout a user
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  }
}