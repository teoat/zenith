import { useState, useCallback } from 'react';

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

  constructor() {
    this.initializeConsistencyChecks();
    this.initializeFailoverStrategies();
  }

  private initializeConsistencyChecks() {
    const checks: DataConsistencyCheck[] = [
      {
        id: 'database-connection',
        name: 'Database Connection',
        check: async () => {
          try {
            // Check database connectivity
            const response = await fetch('/api/health/database');
            return response.ok;
          } catch {
            return false;
          }
        },
        lastChecked: 0,
        lastResult: null
      },
      {
        id: 'data-integrity',
        name: 'Data Integrity',
        check: async () => {
          try {
            // Check data consistency
            const response = await fetch('/api/health/integrity');
            const data = await response.json();
            return data.consistent === true;
          } catch {
            return false;
          }
        },
        lastChecked: 0,
        lastResult: null
      },
      {
        id: 'cache-consistency',
        name: 'Cache Consistency',
        check: async () => {
          try {
            // Check cache vs database consistency
            const response = await fetch('/api/health/cache');
            const data = await response.json();
            return data.consistent === true;
          } catch {
            return false;
          }
        },
        lastChecked: 0,
        lastResult: null
      }
    ];

    checks.forEach(check => {
      this.consistencyChecks.set(check.id, check);
    });
  }

  private initializeFailoverStrategies() {
    const strategies: FailoverStrategy[] = [
      {
        id: 'database-failover',
        name: 'Database Failover',
        description: 'Switch to backup database instance',
        isActive: false,
        priority: 1,
        execute: async () => {
          console.log('Executing database failover...');
          // Implementation would switch database connections
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('Database failover completed');
        }
      },
      {
        id: 'cache-invalidation',
        name: 'Cache Invalidation',
        description: 'Clear and rebuild cache from database',
        isActive: false,
        priority: 2,
        execute: async () => {
          console.log('Executing cache invalidation...');
          try {
            await fetch('/api/cache/invalidate', { method: 'POST' });
            console.log('Cache invalidation completed');
          } catch (error) {
            console.error('Cache invalidation failed:', error);
          }
        }
      },
      {
        id: 'service-restart',
        name: 'Service Restart',
        description: 'Restart affected microservices',
        isActive: false,
        priority: 3,
        execute: async () => {
          console.log('Executing service restart...');
          try {
            await fetch('/api/admin/restart-services', { method: 'POST' });
            console.log('Service restart completed');
          } catch (error) {
            console.error('Service restart failed:', error);
          }
        }
      }
    ];

    strategies.forEach(strategy => {
      this.failoverStrategies.set(strategy.id, strategy);
    });
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
          errorMessage: undefined
        };
        results.set(id, updatedCheck);
        this.consistencyChecks.set(id, updatedCheck);
      } catch (error) {
        const updatedCheck: DataConsistencyCheck = {
          ...check,
          lastChecked: Date.now(),
          lastResult: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
        results.set(id, updatedCheck);
        this.consistencyChecks.set(id, updatedCheck);
      }
    }

    return results;
  }

  async executeFailoverIfNeeded(): Promise<void> {
    const checkResults = await this.runConsistencyChecks();
    const failedChecks = Array.from(checkResults.values()).filter(check => check.lastResult === false);

    if (failedChecks.length > 0) {
      console.warn(`🚨 ${failedChecks.length} consistency checks failed, initiating failover...`);

      // Execute failover strategies in priority order
      const strategies = Array.from(this.failoverStrategies.values())
        .sort((a, b) => a.priority - b.priority);

      for (const strategy of strategies) {
        try {
          console.log(`Executing failover strategy: ${strategy.name}`);
          await strategy.execute();
          strategy.isActive = true;
          this.failoverStrategies.set(strategy.id, strategy);

          // Re-run checks to see if failover resolved the issue
          const recheckResults = await this.runConsistencyChecks();
          const stillFailed = Array.from(recheckResults.values()).filter(check => check.lastResult === false);

          if (stillFailed.length === 0) {
            console.log('✅ Failover successful, all checks now passing');
            break;
          }
        } catch (error) {
          console.error(`❌ Failover strategy ${strategy.name} failed:`, error);
        }
      }
    }
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔄 Starting reliability monitoring...');

    this.checkInterval = setInterval(async () => {
      try {
        await this.executeFailoverIfNeeded();
      } catch (error) {
        console.error('Reliability monitoring error:', error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Stopped reliability monitoring');
  }

  getConsistencyChecks(): DataConsistencyCheck[] {
    return Array.from(this.consistencyChecks.values());
  }

  getFailoverStrategies(): FailoverStrategy[] {
    return Array.from(this.failoverStrategies.values());
  }
}

// Singleton instance
export const reliabilityManager = new ReliabilityManager();

// React hook for reliability management
export const useReliabilityManager = () => {
  const [consistencyChecks, setConsistencyChecks] = useState(reliabilityManager.getConsistencyChecks());
  const [failoverStrategies, setFailoverStrategies] = useState(reliabilityManager.getFailoverStrategies());
  const [isMonitoring, setIsMonitoring] = useState(false);

  const updateState = useCallback(() => {
    setConsistencyChecks(reliabilityManager.getConsistencyChecks());
    setFailoverStrategies(reliabilityManager.getFailoverStrategies());
  }, []);

  const runChecks = useCallback(async () => {
    await reliabilityManager.runConsistencyChecks();
    updateState();
  }, [updateState]);

  const executeFailover = useCallback(async () => {
    await reliabilityManager.executeFailoverIfNeeded();
    updateState();
  }, [updateState]);

  const startMonitoring = useCallback(() => {
    reliabilityManager.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    reliabilityManager.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  return {
    consistencyChecks,
    failoverStrategies,
    isMonitoring,
    runChecks,
    executeFailover,
    startMonitoring,
    stopMonitoring
  };
};