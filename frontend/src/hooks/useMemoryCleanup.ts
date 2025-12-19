import { useEffect, useRef, useState, useCallback } from 'react';

export interface MemoryMonitor {
  jsHeapSize: number;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  timestamp: number;
  activeTimers?: number;
  registeredComponents?: number;
}

export interface MemoryMonitorConfig {
  enableAlerts?: boolean;
  alertThreshold?: number;
  updateInterval?: number;
}

export function useMemoryMonitor(config: MemoryMonitorConfig = {}) {
  const [memoryStats, setMemoryStats] = useState<MemoryMonitor | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    updateInterval = 5000
  } = config;

  const monitorMemory = useCallback(() => {
    // Check if performance.memory is available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number } }).memory;
      const memoryInfo: MemoryMonitor = {
        jsHeapSize: memory.jsHeapSizeLimit,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        timestamp: Date.now()
      };

      setMemoryStats(memoryInfo);
    }
  }, []);

  const takeSnapshot = useCallback((_label?: string) => {
    monitorMemory();
  }, [monitorMemory]);

  const forceCleanup = useCallback(() => {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    // Clear any cached data
    setTimeout(() => monitorMemory(), 100);
  }, [monitorMemory]);

  useEffect(() => {
    // Initial check
    monitorMemory();

    // Set up interval monitoring
    intervalRef.current = setInterval(monitorMemory, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [monitorMemory, updateInterval]);

  return {
    memoryStats,
    takeSnapshot,
    forceCleanup,
    stop: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };
}

export default useMemoryMonitor;