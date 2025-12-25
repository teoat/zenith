// frontend/src/hooks/useMemoryCleanup.js
import { useEffect, useRef } from 'react';
import memoryManager from '../utils/memoryManager';

/**
 * React hook for automatic memory cleanup and leak prevention
 * @param {string} componentName - Optional name for debugging
 * @returns {Object} - Cleanup utilities
 */
export function useMemoryCleanup(componentName = 'UnknownComponent') {
  const componentRef = useRef(null);
  const cleanupFunctionsRef = useRef([]);

  useEffect(() => {
    // Copy ref value for cleanup - avoids stale ref warning
    const currentRef = componentRef.current;
    
    // Register component with memory manager
    memoryManager.registerCleanup(currentRef, () => {
      console.log(`🧹 Cleaning up ${componentName}`);

      // Execute all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error(`Error in ${componentName} cleanup:`, error);
        }
      });

      cleanupFunctionsRef.current = [];
    });

    return () => {
      // Cleanup when component unmounts
      memoryManager.unregisterCleanup(currentRef);
    };
  }, [componentName]);

  // Utility functions for component cleanup
  const addCleanup = (cleanupFn) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  };

  const addEventListener = (element, event, handler, options) => {
    memoryManager.addTrackedEventListener(element, event, handler, options);
    addCleanup(() => {
      memoryManager.removeElementListeners(element);
    });
  };

  const setTimeout = (callback, delay, ...args) => {
    const timerId = memoryManager.setTrackedTimeout(callback, delay, ...args);
    addCleanup(() => {
      memoryManager.clearTrackedTimeout(timerId);
    });
    return timerId;
  };

  const setInterval = (callback, delay, ...args) => {
    const intervalId = memoryManager.setTrackedInterval(callback, delay, ...args);
    addCleanup(() => {
      memoryManager.clearTrackedInterval(intervalId);
    });
    return intervalId;
  };

  return {
    componentRef,
    addCleanup,
    addEventListener,
    setTimeout,
    setInterval,
    getMemoryStats: () => memoryManager.getMemoryStats()
  };
}

/**
 * Hook for monitoring memory usage in components
 * @param {Object} options - Monitoring options
 * @returns {Object} - Memory monitoring data
 */
export function useMemoryMonitor(options = {}) {
  const {
    enableAlerts = true,
    alertThreshold = 80, // percentage
    checkInterval = 10000 // 10 seconds
  } = options;

  const memoryStatsRef = useRef(null);

  useEffect(() => {
    const updateMemoryStats = () => {
      memoryStatsRef.current = memoryManager.getMemoryStats();
    };

    // Initial update
    updateMemoryStats();

    // Set up periodic updates
    const intervalId = memoryManager.setTrackedInterval(updateMemoryStats, checkInterval);

    // Listen for memory alerts
    let alertHandler;
    if (enableAlerts) {
      alertHandler = (event) => {
        const { level, memoryUsage } = event.detail;
        if (memoryUsage.percentage > alertThreshold) {
          console.warn(`🚨 ${level.toUpperCase()}: Memory usage at ${memoryUsage.percentage.toFixed(1)}%`);
        }
      };

      window.addEventListener('memoryAlert', alertHandler);
    }

    return () => {
      memoryManager.clearTrackedInterval(intervalId);
      if (alertHandler) {
        window.removeEventListener('memoryAlert', alertHandler);
      }
    };
  }, [enableAlerts, alertThreshold, checkInterval]);

  return {
    getMemoryStats: () => memoryStatsRef.current,
    takeSnapshot: (label) => memoryManager.takeMemorySnapshot(label),
    forceCleanup: () => memoryManager.performEmergencyCleanup()
  };
}

export default useMemoryCleanup;