import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { DatabaseError } from '../utils/errors'; // Assuming you have a custom error structure

interface TokenMetadata {
  userId: string;
  tokenFamily: string;
  lastRefreshed: Date;
  expiresAt: Date;
  revoked: boolean;
}

export class TokenService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Create a new token family when the user logs in
   * @param userId User ID for whom to create a token family
   * @returns Token family ID 
   */
  async createTokenFamily(userId: string): Promise<string> {
    const tokenFamilyId = randomUUID();
    
    const { error } = await this.supabase.from('token_families').insert({
      id: tokenFamilyId,
      user_id: userId,
      created_at: new Date(),
      last_used: new Date(),
      is_revoked: false
    });

    if (error) {
      throw new DatabaseError(`Failed to create token family for user ${userId}: ${error.message}`, { code: error.code });
    }

    return tokenFamilyId;
  }

  /**
   * Store token metadata in the database
   * @param refreshToken The refresh token
   * @param metadata Token metadata
   */
  async storeTokenMetadata(refreshToken: string, metadata: TokenMetadata): Promise<void> {
    // IMPORTANT: In a real production environment, the 'refreshToken' should be hashed
    // before storing it in the database. Do not store raw refresh tokens.
    const { error } = await this.supabase.from('refresh_tokens').insert({
      token: refreshToken, // Store hashed version in production
      user_id: metadata.userId,
      token_family: metadata.tokenFamily,
      last_refreshed: metadata.lastRefreshed,
      expires_at: metadata.expiresAt,
      is_revoked: metadata.revoked
    });

    if (error) {
      throw new DatabaseError(`Failed to store token metadata for user ${metadata.userId}, family ${metadata.tokenFamily}: ${error.message}`, { code: error.code });
    }
  }

  /**
   * Invalidate a refresh token after use to implement token rotation
   * @param refreshToken The used refresh token to invalidate
   */
  async invalidateRefreshToken(refreshToken: string): Promise<void> {
    const { error } = await this.supabase
      .from('refresh_tokens')
      .update({ is_revoked: true, revoked_at: new Date() })
      .eq('token', refreshToken);

    if (error) {
      throw new DatabaseError(`Failed to invalidate refresh token: ${error.message}`, { code: error.code });
    }
  }

  /**
   * Revoke an entire token family (e.g., on logout or security breach)
   * @param tokenFamilyId ID of the token family to revoke
   * @param userId User ID for verification
   */
  async revokeTokenFamily(tokenFamilyId: string, userId: string): Promise<void> {
    // Revoke the token family
    const { error: familyError } = await this.supabase
      .from('token_families')
      .update({ is_revoked: true, revoked_at: new Date() })
      .eq('id', tokenFamilyId)
      .eq('user_id', userId);

    if (familyError) {
      throw new DatabaseError(`Failed to revoke token family ${tokenFamilyId} for user ${userId}: ${familyError.message}`, { code: familyError.code });
    }

    // Revoke all refresh tokens in this family
    const { error: tokensError } = await this.supabase
      .from('refresh_tokens')
      .update({ is_revoked: true, revoked_at: new Date() })
      .eq('token_family', tokenFamilyId)
      .eq('user_id', userId);

    if (tokensError) {
      throw new DatabaseError(`Failed to revoke refresh tokens in family ${tokenFamilyId} for user ${userId}: ${tokensError.message}`, { code: tokensError.code });
    }
  }

  /**
   * Check if a refresh token has been used before (to detect token reuse attacks)
   * @param refreshToken The refresh token to check
   * @returns Metadata about the token if valid, null if invalid
   */
  async validateRefreshToken(refreshToken: string): Promise<TokenMetadata | null> {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .select('user_id, token_family, last_refreshed, expires_at, is_revoked')
      .eq('token', refreshToken)
      .single();

    if (error || !data) {
      // It's okay if a token is not found, just return null. Log if necessary for debugging.
      // console.debug(`Refresh token not found or error: ${error?.message}`);
      return null;
    }

    // Check if token is revoked or expired
    const isExpired = new Date(data.expires_at) < new Date();
    if (data.is_revoked || isExpired) { // Explicitly check is_revoked
      return null;
    }

    return {
      userId: data.user_id,
      tokenFamily: data.token_family,
      lastRefreshed: new Date(data.last_refreshed),
      expiresAt: new Date(data.expires_at),
      revoked: data.is_revoked
    };
  }

  /**
   * Check if a token family has been revoked
   * @param tokenFamilyId ID of the token family to check
   * @returns boolean indicating if the token family is valid
   */
  async isTokenFamilyValid(tokenFamilyId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('token_families')
      .select('is_revoked')
      .eq('id', tokenFamilyId)
      .single();

    if (error || !data) {
      // If family not found or error, consider it invalid.
      // console.debug(`Token family ${tokenFamilyId} not found or error: ${error?.message}`);
      return false;
    }

    return !data.is_revoked;
  }

  /**
   * Update the last used timestamp for a token family
   * @param tokenFamilyId ID of the token family
   */
  async updateTokenFamilyUsage(tokenFamilyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('token_families')
      .update({ last_used: new Date() })
      .eq('id', tokenFamilyId);

    if (error) {
      throw new DatabaseError(`Failed to update token family usage for ${tokenFamilyId}: ${error.message}`, { code: error.code });
    }
  }
}
