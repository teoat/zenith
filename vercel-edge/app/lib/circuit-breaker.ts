/**
 * Circuit Breaker for Vercel Edge Gateway
 * Prevents cascading failures by stopping requests to failing services
 */

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  successThreshold: number;
}

export interface CircuitMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  rejectedCalls: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private halfOpenCalls: number = 0;
  private successfulCalls: number = 0;
  private failedCalls: number = 0;
  private rejectedCalls: number = 0;
  private readonly config: CircuitConfig;

  constructor(config: Partial<CircuitConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      recoveryTimeoutMs: config.recoveryTimeoutMs ?? 60000,
      successThreshold: config.successThreshold ?? 3,
    };
  }

  getState(): CircuitState {
    if (this.state === "open") {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = "half_open";
        this.halfOpenCalls = 0;
      }
    }
    return this.state;
  }

  getMetrics(): CircuitMetrics {
    return {
      totalCalls: this.successfulCalls + this.failedCalls + this.rejectedCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      rejectedCalls: this.rejectedCalls,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();

    if (state === "open") {
      this.rejectedCalls++;
      throw new Error(`Circuit breaker open for service`);
    }

    if (state === "half_open") {
      if (this.halfOpenCalls >= this.config.successThreshold) {
        this.rejectedCalls++;
        throw new Error(`Circuit breaker half-open limit reached`);
      }
      this.halfOpenCalls++;
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
    this.successfulCalls++;

    if (this.state === "half_open") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = "closed";
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failedCalls++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "closed") {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = "open";
        this.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;
      }
    } else if (this.state === "half_open") {
      this.state = "open";
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;
    }
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    this.halfOpenCalls = 0;
  }

  forceOpen(): void {
    this.state = "open";
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs;
  }

  forceClose(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
  }
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, config?: Partial<CircuitConfig>): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(config));
  }
  return circuitBreakers.get(name)!;
}

export function resetAllCircuitBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset();
  }
}

export function getAllCircuitBreakerStates(): Array<{ name: string; state: CircuitState; metrics: CircuitMetrics }> {
  return Array.from(circuitBreakers.entries()).map(([name, breaker]) => ({
    name,
    state: breaker.getState(),
    metrics: breaker.getMetrics(),
  }));
}

export const circuitBreaker = {
  CircuitBreaker,
  getCircuitBreaker,
  resetAllCircuitBreakers,
  getAllCircuitBreakerStates,
};
