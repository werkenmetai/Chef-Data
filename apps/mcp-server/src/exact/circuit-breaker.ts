/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by tracking endpoint failures and temporarily
 * blocking requests to failing endpoints.
 *
 * States:
 * - closed: Normal operation, requests pass through
 * - open: Failures exceeded threshold, requests are blocked
 * - half-open: Testing if service recovered, allows single request
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  /** Number of failures before circuit opens (default: 5) */
  threshold?: number;
  /** Milliseconds to wait before attempting half-open (default: 60000) */
  timeout?: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.threshold = config.threshold ?? 5; // failures before open
    this.timeout = config.timeout ?? 60000; // ms to wait before half-open
  }

  /**
   * Check if a request can be made through this circuit breaker.
   * @returns true if the request should proceed, false if blocked
   */
  canRequest(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true; // half-open allows one request
  }

  /**
   * Record a successful request. Resets the circuit to closed state.
   */
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Record a failed request. Opens the circuit if threshold is reached.
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  /**
   * Get the current state of the circuit breaker.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get the current failure count.
   */
  getFailureCount(): number {
    return this.failures;
  }

  /**
   * Reset the circuit breaker to its initial closed state.
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailure = 0;
  }
}
