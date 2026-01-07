import { secureLogger } from "@/utils/secureLogger";

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Circuit is open, failing fast
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time in ms before attempting recovery
  monitoringPeriod: number; // Time window in ms to count failures
  successThreshold: number; // Number of successes needed in HALF_OPEN to close
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        secureLogger.info(
          "Circuit Breaker",
          `Circuit breaker ${this.name} transitioning to HALF_OPEN`,
        );
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - failing fast`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.reset();
        secureLogger.info(
          "Circuit Breaker",
          `Circuit breaker ${this.name} closed after successful recovery`,
        );
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery test, go back to OPEN
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      secureLogger.warn(
        "Circuit Breaker",
        `Circuit breaker ${this.name} recovery failed, returning to OPEN`,
      );
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      secureLogger.warn(
        "Circuit Breaker",
        `Circuit breaker ${this.name} opened due to ${this.failureCount} failures`,
      );
    }
  }

  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  // Manual control methods
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    secureLogger.warn(
      "Circuit Breaker",
      `Circuit breaker ${this.name} manually opened`,
    );
  }

  forceClose(): void {
    this.reset();
    secureLogger.info(
      "Circuit Breaker",
      `Circuit breaker ${this.name} manually closed`,
    );
  }

  forceHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    secureLogger.info(
      "Circuit Breaker",
      `Circuit breaker ${this.name} manually set to HALF_OPEN`,
    );
  }
}

// Circuit Breaker Registry
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  create(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const breaker = new CircuitBreaker(name, config);
    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  getStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }
}

// Default configurations
export const DEFAULT_CIRCUIT_CONFIGS = {
  api: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    successThreshold: 3,
  },
  database: {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 180000, // 3 minutes
    successThreshold: 2,
  },
  externalService: {
    failureThreshold: 3,
    recoveryTimeout: 120000, // 2 minutes
    monitoringPeriod: 600000, // 10 minutes
    successThreshold: 2,
  },
} as const;

// Global registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Convenience functions
export function createCircuitBreaker(
  name: string,
  config: CircuitBreakerConfig,
): CircuitBreaker {
  return circuitBreakerRegistry.create(name, config);
}

export function getCircuitBreaker(name: string): CircuitBreaker | undefined {
  return circuitBreakerRegistry.get(name);
}

export function getAllCircuitBreakerStats(): Record<
  string,
  CircuitBreakerStats
> {
  return circuitBreakerRegistry.getStats();
}
