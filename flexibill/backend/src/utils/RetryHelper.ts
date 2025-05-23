/**
 * Retry helper for handling transient failures with exponential backoff
 */

/**
 * Check if an error is likely transient (temporary)
 * @param error Error to check
 * @returns True if the error is likely transient
 */
export function isTransientError(error: any): boolean {
  // Network errors are typically transient
  if (error.name === 'FetchError' || error.name === 'NetworkError') {
    return true;
  }

  // Timeout errors are typically transient
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }

  // Server errors (5xx) are typically transient
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Rate limiting (429) is transient
  if (error.status === 429) {
    return true;
  }
  
  // Some specific Plaid API errors
  if (error.error_code) {
    const transientPlaidErrors = [
      'RATE_LIMIT_EXCEEDED',
      'INTERNAL_SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'PLANNED_MAINTENANCE'
    ];
    
    return transientPlaidErrors.includes(error.error_code);
  }
  
  // For standard Plaid API error object
  if (error.error) {
    if (typeof error.error === 'object' && error.error.error_code) {
      const transientPlaidErrors = [
        'RATE_LIMIT_EXCEEDED',
        'INTERNAL_SERVER_ERROR',
        'SERVICE_UNAVAILABLE',
        'PLANNED_MAINTENANCE'
      ];
      
      return transientPlaidErrors.includes(error.error.error_code);
    }
  }
  
  return false;
}

/**
 * Calculate backoff time using exponential backoff with jitter
 * @param attempt Current attempt number (0-based)
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Time to wait in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  // Exponential backoff: 2^attempt * baseDelay
  const exponentialDelay = Math.pow(2, attempt) * baseDelay;
  
  // Apply a random jitter of 0-25%
  const jitterFactor = 1 + Math.random() * 0.25;
  
  // Apply jitter and cap at maxDelay
  return Math.min(exponentialDelay * jitterFactor, maxDelay);
}

/**
 * Execute a function with retry logic
 * @param fn Function to execute
 * @param maxRetries Maximum number of retries
 * @param isRetryable Optional function to determine if an error is retryable
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Promise that resolves with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  isRetryable: (error: any) => boolean = isTransientError,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt to execute the function
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If we've reached max retries or error is not retryable, break out
      if (attempt >= maxRetries || !isRetryable(error)) {
        break;
      }
      
      // Calculate backoff time
      const backoffTime = calculateBackoff(attempt, baseDelay, maxDelay);
      
      // Log retry attempt
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${backoffTime}ms`, {
        error: error.message || error,
      });
      
      // Wait for backoff time
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}