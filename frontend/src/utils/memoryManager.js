// frontend/src/utils/memoryManager.js
import { useEffect } from 'react';

class MemoryManager {
  constructor() {
    this.monitors = new Map();
    this.cleanupRegistry = new WeakMap();
    this.memoryThresholds = {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 200 * 1024 * 1024, // 200MB
      max: 256 * 1024 * 1024 // 256MB
    };

    this.eventListeners = new WeakMap();
    this.timers = new Set();
    this.intervals = new Set();

    this.startMemoryMonitoring();
  }

  // Memory monitoring
  startMemoryMonitoring() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.memoryCheckInterval = setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Check every 30 seconds

      // Initial memory snapshot
      this.takeMemorySnapshot('initial');
    }
  }

  checkMemoryUsage() {
    if (!performance.memory) return;

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const memoryUsage = {
      used: usedJSHeapSize,
      total: totalJSHeapSize,
      limit: jsHeapSizeLimit,
      percentage: (usedJSHeapSize / jsHeapSizeLimit) * 100
    };

    // Check thresholds
    if (usedJSHeapSize > this.memoryThresholds.critical) {
      console.warn('🚨 CRITICAL: High memory usage detected', memoryUsage);
      this.triggerMemoryAlert('critical', memoryUsage);
    } else if (usedJSHeapSize > this.memoryThresholds.warning) {
      console.warn('⚠️ WARNING: Elevated memory usage', memoryUsage);
      this.triggerMemoryAlert('warning', memoryUsage);
    }

    // Auto cleanup if memory is getting high
    if (memoryUsage.percentage > 80) {
      this.performEmergencyCleanup();
    }
  }

  triggerMemoryAlert(level, memoryUsage) {
    // Emit custom event for React components to handle
    const event = new CustomEvent('memoryAlert', {
      detail: { level, memoryUsage, timestamp: Date.now() }
    });
    window.dispatchEvent(event);

    // Log to IPC for main process monitoring
    if (window.electronAPI?.logMemoryAlert) {
      window.electronAPI.logMemoryAlert(level, memoryUsage);
    }
  }

  takeMemorySnapshot(label = 'snapshot') {
    if (!performance.memory) return null;

    const snapshot = {
      label,
      timestamp: Date.now(),
      memory: { ...performance.memory },
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      registeredCleanups: this.cleanupRegistry.size
    };

    this.memorySnapshots = this.memorySnapshots || [];
    this.memorySnapshots.push(snapshot);

    // Keep only last 10 snapshots
    if (this.memorySnapshots.length > 10) {
      this.memorySnapshots.shift();
    }

    return snapshot;
  }

  // Component cleanup management
  registerCleanup(component, cleanupFn) {
    if (!this.cleanupRegistry.has(component)) {
      this.cleanupRegistry.set(component, []);
    }
    this.cleanupRegistry.get(component).push(cleanupFn);
  }

  unregisterCleanup(component) {
    if (this.cleanupRegistry.has(component)) {
      const cleanups = this.cleanupRegistry.get(component);
      cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
      this.cleanupRegistry.delete(component);
    }
  }

  // Event listener management
  addTrackedEventListener(element, event, handler, options) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }

    element.addEventListener(event, handler, options);
    this.eventListeners.get(element).push({ event, handler, options });

    // Auto cleanup when element is removed from DOM
    if (element.parentNode) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === element || node.contains(element)) {
              this.removeElementListeners(element);
              observer.disconnect();
            }
          });
        });
      });

      observer.observe(element.parentNode, { childList: true, subtree: true });
    }
  }

  removeElementListeners(element) {
    if (this.eventListeners.has(element)) {
      const listeners = this.eventListeners.get(element);
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListeners.delete(element);
    }
  }

  // Timer management
  setTrackedTimeout(callback, delay, ...args) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback(...args);
    }, delay);

    this.timers.add(timerId);
    return timerId;
  }

  clearTrackedTimeout(timerId) {
    if (this.timers.has(timerId)) {
      clearTimeout(timerId);
      this.timers.delete(timerId);
    }
  }

  setTrackedInterval(callback, delay, ...args) {
    const intervalId = setInterval(callback, delay, ...args);
    this.intervals.add(intervalId);
    return intervalId;
  }

  clearTrackedInterval(intervalId) {
    if (this.intervals.has(intervalId)) {
      clearInterval(intervalId);
      this.intervals.delete(intervalId);
    }
  }

  // Emergency cleanup
  performEmergencyCleanup() {
    console.log('🧹 Performing emergency memory cleanup...');

    // Clear non-essential timers
    const timersToClear = Array.from(this.timers).slice(0, Math.floor(this.timers.size * 0.5));
    timersToClear.forEach(timerId => {
      this.clearTrackedTimeout(timerId);
    });

    // Clear non-essential intervals
    const intervalsToClear = Array.from(this.intervals).slice(0, Math.floor(this.intervals.size * 0.3));
    intervalsToClear.forEach(intervalId => {
      this.clearTrackedInterval(intervalId);
    });

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Take post-cleanup snapshot
    this.takeMemorySnapshot('post-cleanup');

    console.log('✅ Emergency cleanup completed');
  }

  // Cleanup on page unload
  cleanup() {
    // Clear all tracked timers
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();

    // Clear all tracked intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();

    // Clear memory check interval
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    // Clear all component cleanups
    this.cleanupRegistry = new WeakMap();
    this.eventListeners = new WeakMap();
  }
}

// Create singleton instance
const memoryManager = new MemoryManager();

// React hook integration (Standalone function)
export const useMemoryCleanup = (componentRef) => {
  useEffect(() => {
    const currentRef = componentRef.current;
    return () => {
      if (currentRef) {
        memoryManager.unregisterCleanup(currentRef);
      }
    };
  }, [componentRef]);
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryManager.cleanup();
  });
}

export default memoryManager;
export { MemoryManager };