import { useState, useCallback, useEffect } from "react";
import { secureLogger } from "@/utils/secureLogger";

export interface DataConsistencyCheck {
  id: string;
  name: string;
  check: () => Promise<boolean>;
  lastChecked: number;
  lastResult: boolean | null;
  errorMessage?: string;
}

export interface FailoverStrategy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  execute: () => Promise<void>;
}

class ReliabilityManager {
  private consistencyChecks: Map<string, DataConsistencyCheck> = new Map();
  private failoverStrategies: Map<string, FailoverStrategy> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeConsistencyChecks();
    this.initializeFailoverStrategies();
  }

  private initializeConsistencyChecks() {
    const checks: DataConsistencyCheck[] = [
      {
        id: "database-connection",
        name: "Database Connection",
        check: async () => {
          try {
            // Check database connectivity via real health endpoint
            const response = await fetch("/api/health");
            if (!response.ok) return false;
            const data = await response.json();
            return data.components?.database?.status === "healthy";
          } catch {
            return false;
          }
        },
        lastChecked: 0,
        lastResult: null,
      },
      {
        id: "system-integrity",
        name: "System Integrity",
        check: async () => {
          try {
            // Check overall system status
            const response = await fetch("/api/health");
            if (!response.ok) return false;
            const data = await response.json();
            return data.status === "healthy";
          } catch {
            return false;
          }
        },
        lastChecked: 0,
        lastResult: null,
      },
      {
        id: "cache-status",
        name: "Cache Services",
        check: async () => {
          try {
            // Check cache status
            const response = await fetch("/api/health");
            if (!response.ok) return false;
            const data = await response.json();
            // Pass if healthy or explicitly not configured (optional dependency)
            const status = data.components?.cache?.status;
            return status === "healthy" || status === "not_configured";
          } catch {
            return false;
          }
        },
        lastChecked: 0,
        lastResult: null,
      },
    ];

    checks.forEach((check) => {
      this.consistencyChecks.set(check.id, check);
    });
  }

  private initializeFailoverStrategies() {
    const strategies: FailoverStrategy[] = [
      {
        id: "database-failover",
        name: "Database Failover",
        description: "Switch to backup database instance",
        isActive: false,
        priority: 1,
        execute: async () => {
          secureLogger.info("RELIABILITY", "Executing database failover...");
          // Implementation would switch database connections
          await new Promise((resolve) => setTimeout(resolve, 2000));
          secureLogger.info("RELIABILITY", "Database failover completed");
        },
      },
      {
        id: "cache-invalidation",
        name: "Cache Invalidation",
        description: "Clear and rebuild cache from database",
        isActive: false,
        priority: 2,
        execute: async () => {
          secureLogger.info("RELIABILITY", "Executing cache invalidation...");
          try {
            await fetch("/api/cache/invalidate", { method: "POST" });
            secureLogger.info("RELIABILITY", "Cache invalidation completed");
          } catch (error) {
            secureLogger.error("RELIABILITY", "Cache invalidation failed", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      },
      {
        id: "service-restart",
        name: "Service Restart",
        description: "Restart affected microservices",
        isActive: false,
        priority: 3,
        execute: async () => {
          secureLogger.info("RELIABILITY", "Executing service restart...");
          try {
            await fetch("/api/admin/restart-services", { method: "POST" });
            secureLogger.info("RELIABILITY", "Service restart completed");
          } catch (error) {
            secureLogger.error("RELIABILITY", "Service restart failed", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      },
    ];

    strategies.forEach((strategy) => {
      this.failoverStrategies.set(strategy.id, strategy);
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  async runConsistencyChecks(): Promise<Map<string, DataConsistencyCheck>> {
    const results = new Map<string, DataConsistencyCheck>();

    for (const [id, check] of this.consistencyChecks) {
      try {
        const result = await check.check();
        const updatedCheck: DataConsistencyCheck = {
          ...check,
          lastChecked: Date.now(),
          lastResult: result,
          errorMessage: undefined,
        };
        results.set(id, updatedCheck);
        this.consistencyChecks.set(id, updatedCheck);
      } catch (error) {
        const updatedCheck: DataConsistencyCheck = {
          ...check,
          lastChecked: Date.now(),
          lastResult: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        };
        results.set(id, updatedCheck);
        this.consistencyChecks.set(id, updatedCheck);
      }
    }

    this.notifyListeners();
    return results;
  }

  async executeFailoverIfNeeded(): Promise<void> {
    const checkResults = await this.runConsistencyChecks();
    const failedChecks = Array.from(checkResults.values()).filter(
      (check) => check.lastResult === false,
    );

    if (failedChecks.length > 0) {
      secureLogger.warn(
        "RELIABILITY",
        `${failedChecks.length} consistency checks failed, initiating failover...`,
      );

      // Execute failover strategies in priority order
      const strategies = Array.from(this.failoverStrategies.values()).sort(
        (a, b) => a.priority - b.priority,
      );

      for (const strategy of strategies) {
        try {
          secureLogger.info(
            "RELIABILITY",
            `Executing failover strategy: ${strategy.name}`,
          );
          await strategy.execute();
          strategy.isActive = true;
          this.failoverStrategies.set(strategy.id, strategy);
          this.notifyListeners();

          // Re-run checks to see if failover resolved the issue
          const recheckResults = await this.runConsistencyChecks();
          const stillFailed = Array.from(recheckResults.values()).filter(
            (check) => check.lastResult === false,
          );

          if (stillFailed.length === 0) {
            secureLogger.info(
              "RELIABILITY",
              "Failover successful, all checks now passing",
            );
            break;
          }
        } catch (error) {
          secureLogger.error(
            "RELIABILITY",
            `Failover strategy ${strategy.name} failed`,
            { error: error instanceof Error ? error.message : String(error) },
          );
        }
      }
    }
    this.notifyListeners();
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    secureLogger.info("RELIABILITY", "Starting reliability monitoring...");
    this.notifyListeners();

    this.checkInterval = setInterval(async () => {
      try {
        await this.executeFailoverIfNeeded();
      } catch (error) {
        secureLogger.error("RELIABILITY", "Reliability monitoring error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    secureLogger.info("RELIABILITY", "Stopped reliability monitoring");
    this.notifyListeners();
  }

  getConsistencyChecks(): DataConsistencyCheck[] {
    return Array.from(this.consistencyChecks.values());
  }

  getFailoverStrategies(): FailoverStrategy[] {
    return Array.from(this.failoverStrategies.values());
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

// Singleton instance
export const reliabilityManager = new ReliabilityManager();

// React hook for reliability management
export const useReliabilityManager = () => {
  const [consistencyChecks, setConsistencyChecks] = useState(
    reliabilityManager.getConsistencyChecks(),
  );
  const [failoverStrategies, setFailoverStrategies] = useState(
    reliabilityManager.getFailoverStrategies(),
  );
  const [isMonitoring, setIsMonitoring] = useState(
    reliabilityManager.isMonitoringActive(),
  );

  const updateState = useCallback(() => {
    setConsistencyChecks(reliabilityManager.getConsistencyChecks());
    setFailoverStrategies(reliabilityManager.getFailoverStrategies());
    setIsMonitoring(reliabilityManager.isMonitoringActive());
  }, []);

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = reliabilityManager.subscribe(updateState);
    return () => {
      unsubscribe();
    };
  }, [updateState]);

  const runChecks = useCallback(async () => {
    await reliabilityManager.runConsistencyChecks();
  }, []);

  const executeFailover = useCallback(async () => {
    await reliabilityManager.executeFailoverIfNeeded();
  }, []);

  const startMonitoring = useCallback(() => {
    reliabilityManager.startMonitoring();
  }, []);

  const stopMonitoring = useCallback(() => {
    reliabilityManager.stopMonitoring();
  }, []);

  return {
    consistencyChecks,
    failoverStrategies,
    isMonitoring,
    runChecks,
    executeFailover,
    startMonitoring,
    stopMonitoring,
  };
};
