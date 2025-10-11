/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures in external API calls
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit tripped, rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Successes needed to close from half-open
  timeout: number; // Time to wait before attempting half-open (ms)
  resetTimeout?: number; // Time to reset failure count (ms)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private lastFailureTime: number = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be opened
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        // Circuit breaker closed after recovery
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout;
      // Circuit breaker reopened - service still failing
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout;
      // Circuit breaker opened after failures
    }

    // Reset failure count if enough time has passed
    if (this.options.resetTimeout) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.options.resetTimeout) {
        this.failureCount = 0;
      }
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt) : null
    };
  }

  // Manual control
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

// Pre-configured circuit breakers for common services
export const stripeCircuitBreaker = new CircuitBreaker('Stripe', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  resetTimeout: 300000 // 5 minutes
});

export const openAICircuitBreaker = new CircuitBreaker('OpenAI', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  resetTimeout: 180000 // 3 minutes
});

export const localAICircuitBreaker = new CircuitBreaker('LocalAI', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000, // 10 seconds
  resetTimeout: 60000 // 1 minute
});
