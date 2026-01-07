import { useState, useCallback } from "react";
import { secureLogger } from "@/utils/secureLogger";
import { secureRandom } from "@/utils/secureRandom";

export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  type: "network" | "database" | "service" | "memory" | "cpu";
  probability: number; // 0-1
  duration: number; // milliseconds
  enabled: boolean;
}

export interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

class ChaosEngine {
  private scenarios: Map<string, FailureScenario> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  constructor() {
    this.initializeDefaultScenarios();
  }

  private initializeDefaultScenarios() {
    const defaultScenarios: FailureScenario[] = [
      {
        id: "network-latency",
        name: "Network Latency",
        description: "Adds random network delays to API calls",
        type: "network",
        probability: 0.1,
        duration: 2000,
        enabled: false,
      },
      {
        id: "network-failure",
        name: "Network Failure",
        description: "Simulates complete network disconnection",
        type: "network",
        probability: 0.05,
        duration: 5000,
        enabled: false,
      },
      {
        id: "database-timeout",
        name: "Database Timeout",
        description: "Simulates database query timeouts",
        type: "database",
        probability: 0.08,
        duration: 10000,
        enabled: false,
      },
      {
        id: "service-crash",
        name: "Service Crash",
        description: "Simulates backend service crashes",
        type: "service",
        probability: 0.02,
        duration: 15000,
        enabled: false,
      },
      {
        id: "memory-leak",
        name: "Memory Leak",
        description: "Gradually increases memory usage",
        type: "memory",
        probability: 0.03,
        duration: 30000,
        enabled: false,
      },
    ];

    defaultScenarios.forEach((scenario) => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  // Failure injection methods
  async injectFailure(scenarioId: string): Promise<boolean> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || !scenario.enabled) return false;

    if (secureRandom.random() < scenario.probability) {
      secureLogger.warn(
        "SECURITY",
        `Chaos Engineering: Injecting ${scenario.name}`,
      );

      switch (scenario.type) {
        case "network":
          return this.injectNetworkFailure(scenario);
        case "database":
          return this.injectDatabaseFailure(scenario);
        case "service":
          return this.injectServiceFailure(scenario);
        case "memory":
          return this.injectMemoryFailure(scenario);
        default:
          return false;
      }
    }

    return false;
  }

  private injectNetworkFailure(scenario: FailureScenario): boolean {
    // Simulate network failure by rejecting promises
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (scenario.id === "network-failure") {
        throw new Error("Network failure (chaos engineering)");
      } else if (scenario.id === "network-latency") {
        await new Promise((resolve) => setTimeout(resolve, scenario.duration));
      }
      return originalFetch(...args);
    };

    setTimeout(() => {
      window.fetch = originalFetch;
    }, scenario.duration);

    return true;
  }

  private injectDatabaseFailure(scenario: FailureScenario): boolean {
    // Simulate database timeout
    if (scenario.id === "database-timeout") {
      // This would be implemented in the database layer
      secureLogger.warn("SECURITY", "Chaos: Database timeout injected");
      return true;
    }
    return false;
  }

  private injectServiceFailure(scenario: FailureScenario): boolean {
    // Simulate service crash
    if (scenario.id === "service-crash") {
      // This would trigger service restart logic
      secureLogger.warn("SECURITY", "Chaos: Service crash injected");
      return true;
    }
    return false;
  }

  private injectMemoryFailure(scenario: FailureScenario): boolean {
    // Simulate memory leak
    if (scenario.id === "memory-leak") {
      const leak: any[] = [];
      const leakInterval = setInterval(() => {
        for (let i = 0; i < 1000; i++) {
          leak.push(new Array(1000).fill("memory-leak-data"));
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(leakInterval);
        // Force garbage collection if available
        if (window.gc) window.gc();
      }, scenario.duration);

      return true;
    }
    return false;
  }

  // Circuit breaker implementation
  getCircuitBreaker(serviceName: string): CircuitBreakerState {
    return (
      this.circuitBreakers.get(serviceName) || {
        state: "closed",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      }
    );
  }

  recordFailure(serviceName: string) {
    const breaker = this.getCircuitBreaker(serviceName);
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= 5) {
      breaker.state = "open";
      breaker.nextAttemptTime = Date.now() + 60000; // 1 minute timeout
      secureLogger.warn(
        "SECURITY",
        `Circuit breaker opened for ${serviceName}`,
      );
    }

    this.circuitBreakers.set(serviceName, breaker);
  }

  recordSuccess(serviceName: string) {
    const breaker = this.getCircuitBreaker(serviceName);
    breaker.failureCount = 0;
    breaker.state = "closed";
    this.circuitBreakers.set(serviceName, breaker);
  }

  canExecute(serviceName: string): boolean {
    const breaker = this.getCircuitBreaker(serviceName);

    if (breaker.state === "closed") {
      return true;
    }

    if (breaker.state === "open" && Date.now() > breaker.nextAttemptTime) {
      breaker.state = "half-open";
      this.circuitBreakers.set(serviceName, breaker);
      return true;
    }

    return breaker.state === "half-open";
  }

  // Scenario management
  getScenarios(): FailureScenario[] {
    return Array.from(this.scenarios.values());
  }

  updateScenario(scenarioId: string, updates: Partial<FailureScenario>) {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      this.scenarios.set(scenarioId, { ...scenario, ...updates });
    }
  }

  enableScenario(scenarioId: string) {
    this.updateScenario(scenarioId, { enabled: true });
  }

  disableScenario(scenarioId: string) {
    this.updateScenario(scenarioId, { enabled: false });
  }
}

// Singleton instance
export const chaosEngine = new ChaosEngine();

// React hook for chaos engineering
export const useChaosEngineering = () => {
  const [scenarios, setScenarios] = useState(chaosEngine.getScenarios());

  const updateScenarios = useCallback(() => {
    setScenarios(chaosEngine.getScenarios());
  }, []);

  const enableScenario = useCallback(
    (scenarioId: string) => {
      chaosEngine.enableScenario(scenarioId);
      updateScenarios();
    },
    [updateScenarios],
  );

  const disableScenario = useCallback(
    (scenarioId: string) => {
      chaosEngine.disableScenario(scenarioId);
      updateScenarios();
    },
    [updateScenarios],
  );

  const updateScenario = useCallback(
    (scenarioId: string, updates: Partial<FailureScenario>) => {
      chaosEngine.updateScenario(scenarioId, updates);
      updateScenarios();
    },
    [updateScenarios],
  );

  const getCircuitBreakerState = useCallback((serviceName: string) => {
    return chaosEngine.getCircuitBreaker(serviceName);
  }, []);

  return {
    scenarios,
    enableScenario,
    disableScenario,
    updateScenario,
    getCircuitBreakerState,
    injectFailure: chaosEngine.injectFailure.bind(chaosEngine),
  };
};
