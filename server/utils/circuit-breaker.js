/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures in external API calls
 */
export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN"; // Testing if service recovered
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    constructor(name, options) {
        this.name = name;
        this.options = options;
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.lastFailureTime = 0;
    }
    async execute(fn) {
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
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                // Circuit breaker closed after recovery
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.options.timeout;
            // Circuit breaker reopened - service still failing
        }
        else if (this.failureCount >= this.options.failureThreshold) {
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
    getState() {
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
    reset() {
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
