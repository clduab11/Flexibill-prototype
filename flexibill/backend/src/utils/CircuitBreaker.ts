/**
 * Circuit Breaker implementation for handling external service failures
 * Based on the Circuit Breaker design pattern
 */
export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeout: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successThreshold: number;
  private successCount: number = 0;
  private serviceName: string;

  /**
   * Creates a new circuit breaker
   * @param serviceName Name of the service (for logging)
   * @param failureThreshold Number of failures before opening circuit
   * @param resetTimeout Time in ms to wait before trying to close circuit
   * @param successThreshold Number of successes needed to close circuit in HALF_OPEN state
   */
  constructor(
    serviceName: string,
    failureThreshold: number = 5,
    resetTimeout: number = 30000, // 30 seconds
    successThreshold: number = 2
  ) {
    this.serviceName = serviceName;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.successThreshold = successThreshold;
  }

  /**
   * Executes a function with circuit breaker protection
   * @param fn Function to execute
   * @param fallbackFn Optional fallback function to execute when circuit is open
   * @returns Result of fn or fallbackFn
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallbackFn?: (error: Error) => Promise<T> | T
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      // Check if reset timeout has elapsed
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        console.log(`[CircuitBreaker:${this.serviceName}] Moving from OPEN to HALF_OPEN state`);
        this.state = 'HALF_OPEN';
      } else {
        console.log(`[CircuitBreaker:${this.serviceName}] Circuit OPEN, using fallback`);
        
        // If circuit is open and reset timeout hasn't elapsed, use fallback
        if (fallbackFn) {
          return fallbackFn(new Error('Circuit is open'));
        }
        throw new Error(`Service ${this.serviceName} unavailable - circuit breaker open`);
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // If we're in half-open state, increment success count
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        
        // If we've reached the success threshold, close the circuit
        if (this.successCount >= this.successThreshold) {
          console.log(`[CircuitBreaker:${this.serviceName}] Moving from HALF_OPEN to CLOSED state`);
          this.successCount = 0;
          this.failureCount = 0;
          this.state = 'CLOSED';
        }
      } else if (this.state === 'CLOSED') {
        // Reset failure count on success when closed
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      return this.handleError(error, fallbackFn);
    }
  }

  /**
   * Handles execution errors
   * @param error The error that occurred
   * @param fallbackFn Optional fallback function
   * @returns Result of fallbackFn if provided
   */
  private handleError(
    error: any,
    fallbackFn?: (error: Error) => Promise<any> | any
  ): Promise<any> | any {
    // Increment failure counter
    this.failureCount++;
    this.lastFailureTime = Date.now();

    console.error(`[CircuitBreaker:${this.serviceName}] Error:`, error.message || error);
    console.error(`[CircuitBreaker:${this.serviceName}] Failure count: ${this.failureCount}/${this.failureThreshold}`);

    // If we've reached the failure threshold, open the circuit
    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      console.log(`[CircuitBreaker:${this.serviceName}] Circuit OPEN due to ${this.failureCount} failures`);
      this.state = 'OPEN';
      this.successCount = 0;
    } else if (this.state === 'HALF_OPEN') {
      // If we fail in half-open state, go back to open
      console.log(`[CircuitBreaker:${this.serviceName}] Moving from HALF_OPEN back to OPEN state due to failure`);
      this.state = 'OPEN';
      this.successCount = 0;
    }

    // Use fallback if provided
    if (fallbackFn) {
      return fallbackFn(error instanceof Error ? error : new Error(String(error)));
    }
    
    // Re-throw the error
    throw error;
  }

  /**
   * Get the current state of the circuit breaker
   * @returns The current state
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  /**
   * Reset the circuit breaker to its initial state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    console.log(`[CircuitBreaker:${this.serviceName}] Reset to CLOSED state`);
  }

  /**
   * Force the circuit into a specific state (for testing purposes)
   * @param state The state to force
   */
  forceState(state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    this.state = state;
    console.log(`[CircuitBreaker:${this.serviceName}] Forced to ${state} state`);
  }
}