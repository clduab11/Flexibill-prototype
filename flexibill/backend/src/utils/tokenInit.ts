import { TokenCleanupService } from '../services/TokenCleanupService';

/**
 * Initialize token management services
 */
export function initializeTokenManagement(): void {
  // Start token cleanup service
  const tokenCleanupService = new TokenCleanupService();
  
  // Run cleanup every hour
  tokenCleanupService.startScheduledCleanup(60);
  
  // Perform initial cleanup
  tokenCleanupService.cleanupExpiredTokens()
    .catch(error => console.error('Initial token cleanup error:', error));
    
  // Check for suspicious activity daily
  setInterval(() => {
    tokenCleanupService.checkSuspiciousActivity()
      .then(suspiciousUserIds => {
        if (suspiciousUserIds.length > 0) {
          // Log suspicious activity for manual review
          console.warn('Suspicious token activity detected for users:', suspiciousUserIds);
        }
      })
      .catch(error => console.error('Suspicious activity check error:', error));
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  console.log('Token management initialized successfully');
}
