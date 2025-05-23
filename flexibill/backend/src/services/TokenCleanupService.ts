import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../db/DatabaseService';

/**
 * Service responsible for cleaning up expired tokens and monitoring token security
 */
export class TokenCleanupService {
  private db: DatabaseService;
  private supabase: SupabaseClient;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.supabase = this.db.getClient();
  }

  /**
   * Start scheduled token cleanup
   * @param intervalMinutes Interval in minutes (default: 60)
   */
  startScheduledCleanup(intervalMinutes: number = 60): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Set new interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens()
        .catch(err => console.error('Token cleanup error:', err));
    }, intervalMinutes * 60 * 1000);

    console.log(`Token cleanup scheduled to run every ${intervalMinutes} minutes`);
  }

  /**
   * Stop scheduled token cleanup
   */
  stopScheduledCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Token cleanup schedule stopped');
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    console.log('Running token cleanup...');
    
    try {
      // Mark expired tokens as revoked
      const { data, error } = await this.supabase
        .from('refresh_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date()
        })
        .lt('expires_at', new Date())
        .eq('is_revoked', false);

      if (error) {
        throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
      }

      const count = data?.length ?? 0;
      console.log(`Cleaned up ${count} expired tokens`);
      return count;
    } catch (error) {
      console.error('Error during token cleanup:', error);
      throw error;
    }
  }

  /**
   * Check for suspicious token activity
   * @returns Array of user IDs with suspicious activity
   */
  async checkSuspiciousActivity(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('suspicious_token_activity')
        .select('user_id');

      if (error) {
        throw new Error(`Failed to check suspicious activity: ${error.message}`);
      }

      const suspiciousUserIds = data.map(item => item.user_id);

      if (suspiciousUserIds.length > 0) {
        console.warn(`Detected suspicious token activity for users:`, suspiciousUserIds);
      }

      return suspiciousUserIds;
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Revoke all tokens for a specific user
   * @param userId User ID whose tokens should be revoked
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // First, revoke all token families
      const { error: familiesError } = await this.supabase
        .from('token_families')
        .update({
          is_revoked: true,
          revoked_at: new Date()
        })
        .eq('user_id', userId)
        .eq('is_revoked', false);

      if (familiesError) {
        throw new Error(`Failed to revoke token families: ${familiesError.message}`);
      }

      // Then, revoke all refresh tokens
      const { error: tokensError } = await this.supabase
        .from('refresh_tokens')
        .update({
          is_revoked: true,
          revoked_at: new Date()
        })
        .eq('user_id', userId)
        .eq('is_revoked', false);

      if (tokensError) {
        throw new Error(`Failed to revoke refresh tokens: ${tokensError.message}`);
      }

      console.log(`All tokens for user ${userId} have been revoked`);
    } catch (error) {
      console.error(`Error revoking tokens for user ${userId}:`, error);
      throw error;
    }
  }
}
