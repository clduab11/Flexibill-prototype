/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',    // Circuit is closed, requests are allowed through
  OPEN = 'OPEN',        // Circuit is open, requests are not allowed through
  HALF_OPEN = 'HALF_OPEN' // Circuit is half-open, testing if the service is back
}

/**
 * Circuit breaker options
 */
interface CircuitBreakerOptions {
  failureThreshold: number;      // Number of failures before opening the circuit
  resetTimeout: number;          // Time in milliseconds to wait before setting to half-open
  monitorInterval?: number;      // Interval for monitoring service health
  maxRetries?: number;           // Maximum number of retries for a single request
  retryDelay?: number;           // Delay between retries in milliseconds
  timeout?: number;              // Timeout for requests in milliseconds
  fallback?: (...args: any[]) => Promise<any>; // Fallback function when circuit is open
  onStateChange?: (from: CircuitState, to: CircuitState) => void; // State change callback
}

/**
 * Default options for the circuit breaker
 */
const defaultOptions: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitorInterval: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 10000, // 10 seconds
};

/**
 * Circuit Breaker class to handle service failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private options: CircuitBreakerOptions;
  private serviceName: string;

  constructor(serviceName: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.serviceName = serviceName;
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn The function to execute
   * @param args Arguments to pass to the function
   * @returns The result of the function or fallback
   */
  async execute<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.transitionState(CircuitState.HALF_OPEN);
      } else {
        console.warn(`Circuit breaker for ${this.serviceName} is OPEN, rejecting request`);
        return this.handleOpenCircuit(args);
      }
    }

    try {
      // Add timeout to the function execution
      const result = await this.executeWithTimeout(fn, this.options.timeout || 10000, ...args);
      
      // If we're half-open and the request succeeded, close the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionState(CircuitState.CLOSED);
      }

      // Reset failure count on success
      this.failureCount = 0;
      return result;
    } catch (error) {
      return this.handleFailure(fn, error, args);
    }
  }

  /**
   * Handle failure by incrementing failure count and potentially opening the circuit
   * @param fn The original function
   * @param error The error that occurred
   * @param args Arguments for the function
   * @returns Result of retry or fallback
   */
  private async handleFailure<T>(
    fn: (...args: any[]) => Promise<T>, 
    error: any, 
    args: any[]
  ): Promise<T> {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.error(`Circuit breaker for ${this.serviceName} failed:`, error);

    // Try to retry if we haven't hit the max retries
    if (this.failureCount <= (this.options.maxRetries || 0)) {
      console.log(`Retrying ${this.serviceName} (attempt ${this.failureCount})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
      
      // Retry the request
      return this.execute(fn, ...args);
    }
    
    // If we hit the failure threshold, open the circuit
    if (this.failureCount >= this.options.failureThreshold) {
      this.transitionState(CircuitState.OPEN);
    }
    
    return this.handleOpenCircuit(args);
  }
  
  /**
   * Handle an open circuit by using the fallback if provided
   * @param args Arguments for the fallback function
   * @returns Result of the fallback or throws an error
   */
  private async handleOpenCircuit<T>(args: any[]): Promise<T> {
    if (this.options.fallback) {
      console.log(`Using fallback for ${this.serviceName}`);
      return this.options.fallback(...args) as Promise<T>;
    }
    
    throw new Error(`Service ${this.serviceName} is unavailable`);
  }
  
  /**
   * Execute a function with a timeout
   * @param fn Function to execute
   * @param timeoutMs Timeout in milliseconds
   * @param args Arguments for the function
   * @returns Result of the function
   */
  private async executeWithTimeout<T>(
    fn: (...args: any[]) => Promise<T>,
    timeoutMs: number,
    ...args: any[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${this.serviceName} timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      fn(...args)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Transition the circuit breaker to a new state
   * @param newState The new state to transition to
   */
  private transitionState(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    console.log(`Circuit breaker for ${this.serviceName} state: ${oldState} -> ${newState}`);
    
    // If we're opening the circuit, set a timer to try half-open
    if (newState === CircuitState.OPEN) {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        this.transitionState(CircuitState.HALF_OPEN);
      }, this.options.resetTimeout);
    }
    
    // Call the state change callback if provided
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }
  
  /**
   * Get the current state of the circuit breaker
   * @returns The current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Reset the circuit breaker to its initial state
   */
  reset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Circuit breaker registry to manage multiple circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  /**
   * Get a circuit breaker by name, creating it if it doesn't exist
   * @param name Name of the circuit breaker
   * @param options Options for the circuit breaker
   * @returns The circuit breaker
   */
  getBreaker(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    
    return this.breakers.get(name)!;
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Export a singleton instance of the registry
export const circuitBreakers = new CircuitBreakerRegistry();

/**
 * Decorator function to wrap a class method with a circuit breaker
 * @param serviceName Name of the service
 * @param options Circuit breaker options
 */
export function withCircuitBreaker(serviceName: string, options: Partial<CircuitBreakerOptions> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const breaker = circuitBreakers.getBreaker(serviceName, options);
      return breaker.execute(originalMethod.bind(this), ...args);
    };
    
    return descriptor;
  };
}
