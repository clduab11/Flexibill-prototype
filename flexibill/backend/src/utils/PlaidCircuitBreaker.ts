import { CircuitBreakerRegistry } from './CircuitBreakerRegistry';
import { PlaidError } from './errors';

// Initialize the Plaid circuit breaker
const PLAID_SERVICE_NAME = 'plaid-api';
const PLAID_FAILURE_THRESHOLD = 3;
const PLAID_RESET_TIMEOUT = 60000; // 1 minute
const PLAID_SUCCESS_THRESHOLD = 2;

// Cache results when circuit is open
const plaidResponseCache = new Map<string, { data: any; timestamp: number }>(); 
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Execute a function with Plaid circuit breaker protection
 * @param key Unique key to identify this operation (for caching)
 * @param fn Function to execute
 * @returns Result of the function
 */
export async function executeWithPlaidCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const registry = CircuitBreakerRegistry.getInstance();
  const breaker = registry.getOrCreate(
    PLAID_SERVICE_NAME,
    PLAID_FAILURE_THRESHOLD,
    PLAID_RESET_TIMEOUT,
    PLAID_SUCCESS_THRESHOLD
  );

  const cacheKey = `${PLAID_SERVICE_NAME}:${key}`;

  // Fallback function that uses cached data or throws a custom error
  const fallback = (error: Error): T => {
    // Check if we have cached data
    const cached = plaidResponseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[PlaidCircuitBreaker] Using cached data for ${key}`);
      return cached.data;
    }
    
    // No cached data, throw a friendly error
    throw new PlaidError(
      'Plaid service is currently unavailable. Please try again later.',
      { cause: error }
    );
  };

  try {
    // Execute with circuit breaker
    const result = await breaker.execute<T>(fn, fallback);
    
    // Cache successful results
    plaidResponseCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    // If it's a non-transient Plaid error, we want to let it through
    // This way, business logic errors aren't treated as circuit breaker events
    if (error instanceof PlaidError && error.message.includes('INVALID_REQUEST')) {
      throw error;
    }
    
    // Otherwise, rethrow the error (which might be our circuit breaker error)
    throw error;
  }
}

/**
 * Reset the Plaid circuit breaker
 */
export function resetPlaidCircuitBreaker(): void {
  const registry = CircuitBreakerRegistry.getInstance();
  const breaker = registry.getOrCreate(PLAID_SERVICE_NAME);
  breaker.reset();
}

/**
 * Get the current state of the Plaid circuit breaker
 */
export function getPlaidCircuitBreakerState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
  const registry = CircuitBreakerRegistry.getInstance();
  const breaker = registry.getOrCreate(PLAID_SERVICE_NAME);
  return breaker.getState();
}

/**
 * Clear the Plaid response cache
 */
export function clearPlaidCache(): void {
  plaidResponseCache.clear();
}