import { CircuitBreaker } from './circuitBreaker';

/**
 * Registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create a circuit breaker for a service
   * @param serviceName Name of the service
   * @param failureThreshold Number of failures before opening circuit
   * @param resetTimeout Time in ms to wait before trying to close circuit
   * @param successThreshold Number of successes needed to close circuit
   */
  public getOrCreate(
    serviceName: string,
    failureThreshold: number = 5,
    resetTimeout: number = 30000,
    successThreshold: number = 2
  ): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(
        serviceName,
        new CircuitBreaker(serviceName, failureThreshold, resetTimeout, successThreshold)
      );
    }
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get all circuit breakers
   */
  public getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Reset all circuit breakers
   */
  public resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Get circuit breaker status for all services
   */
  public getStatus(): Record<string, { state: string; failureCount: number }> {
    const status: Record<string, { state: string; failureCount: number }> = {};
    
    this.breakers.forEach((breaker, name) => {
      status[name] = {
        state: breaker.getState(),
        failureCount: 0 // We don't expose this publicly in the CircuitBreaker class
      };
    });
    
    return status;
  }
}
