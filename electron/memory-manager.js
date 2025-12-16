// electron/memory-manager.js
const { performance } = require('perf_hooks');

class MemoryManager {
  constructor(options = {}) {
    this.gcThreshold = options.gcThreshold || 100 * 1024 * 1024; // 100MB
    this.warningThreshold = options.warningThreshold || 80 * 1024 * 1024; // 80MB
    this.criticalThreshold = options.criticalThreshold || 150 * 1024 * 1024; // 150MB
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds

    this.eventListeners = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.observers = new Set();
    this.cache = new Map();
    this.domElements = new WeakMap();

    this.memoryStats = {
      peakUsage: 0,
      averageUsage: 0,
      gcCycles: 0,
      lastGC: Date.now(),
      warnings: 0,
      criticalEvents: 0
    };

    this.startMonitoring();
  }

  /**
   * Track event listeners for cleanup
   */
  addEventListener(element, event, handler, options = {}) {
    const listenerId = `listener-${Date.now()}-${Math.random()}`;

    element.addEventListener(event, handler, options);

    this.eventListeners.set(listenerId, {
      element,
      event,
      handler,
      options,
      addedAt: Date.now()
    });

    return listenerId;
  }

  /**
   * Remove tracked event listener
   */
  removeEventListener(listenerId) {
    const listener = this.eventListeners.get(listenerId);
    if (listener) {
      try {
        listener.element.removeEventListener(
          listener.event,
          listener.handler,
          listener.options
        );
      } catch (error) {
        console.warn(`Failed to remove event listener ${listenerId}:`, error);
      }
      this.eventListeners.delete(listenerId);
    }
  }

  /**
   * Track timers for cleanup
   */
  setTimeout(handler, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      handler();
    }, delay);

    this.timers.add(timerId);
    return timerId;
  }

  /**
   * Clear tracked timer
   */
  clearTimeout(timerId) {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  /**
   * Track intervals for cleanup
   */
  setInterval(handler, delay) {
    const intervalId = setInterval(handler, delay);
    this.intervals.add(intervalId);
    return intervalId;
  }

  /**
   * Clear tracked interval
   */
  clearInterval(intervalId) {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  /**
   * Track intersection observers
   */
  observe(target, callback, options = {}) {
    const observer = new IntersectionObserver(callback, options);
    observer.observe(target);

    this.observers.add(observer);
    return observer;
  }

  /**
   * Disconnect tracked observer
   */
  disconnect(observer) {
    observer.disconnect();
    this.observers.delete(observer);
  }

  /**
   * Track cache entries with TTL
   */
  setCache(key, value, ttl = 300000) { // 5 minutes default
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
      size: this.estimateSize(value)
    });
  }

  /**
   * Get cached value if not expired
   */
  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`MemoryManager: Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Estimate memory size of an object (rough approximation)
   */
  estimateSize(obj) {
    const seen = new WeakSet();
    const stack = [obj];
    let size = 0;

    while (stack.length) {
      const current = stack.pop();

      if (typeof current === 'boolean') size += 4;
      else if (typeof current === 'string') size += current.length * 2;
      else if (typeof current === 'number') size += 8;
      else if (typeof current === 'object' && current !== null) {
        if (seen.has(current)) continue;
        seen.add(current);

        if (Array.isArray(current)) {
          size += current.length * 8; // rough array overhead
          stack.push(...current);
        } else {
          size += 32; // rough object overhead
          stack.push(...Object.values(current));
        }
      }
    }

    return size;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    const memUsage = process.memoryUsage();

    return {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100
    };
  }

  /**
   * Force garbage collection (development only)
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      this.memoryStats.gcCycles++;
      this.memoryStats.lastGC = Date.now();
      console.log('MemoryManager: Forced garbage collection');
    }
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  checkMemoryUsage() {
    const memory = this.getMemoryUsage();
    const heapUsed = memory.heapUsed;

    // Update peak usage
    if (heapUsed > this.memoryStats.peakUsage) {
      this.memoryStats.peakUsage = heapUsed;
    }

    // Check thresholds
    if (heapUsed > this.criticalThreshold) {
      console.error(`MemoryManager: CRITICAL memory usage: ${memory.heapUsedMB}MB`);
      this.memoryStats.criticalEvents++;

      // Aggressive cleanup
      this.aggressiveCleanup();

    } else if (heapUsed > this.gcThreshold) {
      console.warn(`MemoryManager: High memory usage: ${memory.heapUsedMB}MB, triggering GC`);
      this.forceGC();
      this.cleanupCache();

    } else if (heapUsed > this.warningThreshold) {
      console.warn(`MemoryManager: Elevated memory usage: ${memory.heapUsedMB}MB`);
      this.memoryStats.warnings++;
    }
  }

  /**
   * Perform aggressive cleanup when memory is critical
   */
  aggressiveCleanup() {
    console.log('MemoryManager: Performing aggressive cleanup');

    // Clear all caches
    this.cache.clear();

    // Clear all tracked resources
    this.cleanup();

    // Force GC multiple times
    for (let i = 0; i < 3; i++) {
      this.forceGC();
      // Small delay between GC cycles
      const start = Date.now();
      while (Date.now() - start < 10) {} // Busy wait 10ms
    }

    // Check if cleanup helped
    const memory = this.getMemoryUsage();
    if (memory.heapUsed > this.criticalThreshold) {
      console.error('MemoryManager: Critical memory usage persists after cleanup');
      // Could trigger app restart or other emergency measures
    }
  }

  /**
   * Clean up all tracked resources
   */
  cleanup() {
    console.log('MemoryManager: Cleaning up tracked resources');

    // Clear all timers
    for (const timerId of this.timers) {
      try {
        clearTimeout(timerId);
      } catch (error) {
        console.warn('Failed to clear timer:', error);
      }
    }
    this.timers.clear();

    // Clear all intervals
    for (const intervalId of this.intervals) {
      try {
        clearInterval(intervalId);
      } catch (error) {
        console.warn('Failed to clear interval:', error);
      }
    }
    this.intervals.clear();

    // Disconnect all observers
    for (const observer of this.observers) {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    }
    this.observers.clear();

    // Clear cache
    this.cache.clear();

    // Note: Event listeners are not cleared here as they might be needed
    // They should be cleared by their respective components
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    this.monitoringTimer = this.setInterval(() => {
      this.checkMemoryUsage();
    }, this.monitoringInterval);

    console.log('MemoryManager: Monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      this.clearInterval(this.monitoringTimer);
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const memory = this.getMemoryUsage();

    return {
      current: memory,
      stats: this.memoryStats,
      tracked: {
        eventListeners: this.eventListeners.size,
        timers: this.timers.size,
        intervals: this.intervals.size,
        observers: this.observers.size,
        cacheEntries: this.cache.size
      },
      cacheSize: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
    };
  }

  /**
   * Destroy memory manager
   */
  destroy() {
    this.stopMonitoring();
    this.cleanup();

    // Clear all maps and sets
    this.eventListeners.clear();
    this.timers.clear();
    this.intervals.clear();
    this.observers.clear();
    this.cache.clear();

    console.log('MemoryManager: Destroyed');
  }
}

module.exports = MemoryManager;