// frontend/src/utils/leakPrevention.js
import memoryManager from './memoryManager';

/**
 * Utility functions to prevent common memory leaks in React applications
 */
export class LeakPrevention {
  static preventComponentLeaks(componentName = 'Unknown') {
    return {
      // Cleanup registry for this component
      cleanupRegistry: new Set(),

      // Register cleanup function
      registerCleanup(cleanupFn) {
        this.cleanupRegistry.add(cleanupFn);
        memoryManager.registerCleanup(this, cleanupFn);
      },

      // Execute all cleanups
      cleanup() {
        this.cleanupRegistry.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.error(`Cleanup error in ${componentName}:`, error);
          }
        });
        this.cleanupRegistry.clear();
        memoryManager.unregisterCleanup(this);
      },

      // Safe setTimeout with automatic cleanup
      setTimeout(callback, delay, ...args) {
        const timerId = memoryManager.setTrackedTimeout(callback, delay, ...args);
        this.registerCleanup(() => memoryManager.clearTrackedTimeout(timerId));
        return timerId;
      },

      // Safe setInterval with automatic cleanup
      setInterval(callback, delay, ...args) {
        const intervalId = memoryManager.setTrackedInterval(callback, delay, ...args);
        this.registerCleanup(() => memoryManager.clearTrackedInterval(intervalId));
        return intervalId;
      },

      // Safe event listener with automatic cleanup
      addEventListener(element, event, handler, options) {
        memoryManager.addTrackedEventListener(element, event, handler, options);
        this.registerCleanup(() => memoryManager.removeElementListeners(element));
      },

      // Safe observer with automatic cleanup
      observeWithCleanup(target, observer) {
        observer.observe(target);
        this.registerCleanup(() => observer.disconnect());
      }
    };
  }

  // Prevent async operation leaks
  static createAbortController() {
    const controller = new AbortController();

    // Track the controller
    memoryManager.registerCleanup(controller, () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });

    return controller;
  }

  // Safe async operations with automatic cancellation
  static async withAbortSignal(operation, signal) {
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    const abortPromise = new Promise((_, reject) => {
      if (signal) {
        signal.addEventListener('abort', () => reject(new Error('Operation cancelled')));
      }
    });

    return Promise.race([operation, abortPromise]);
  }

  // Prevent subscription leaks
  static createSubscriptionManager() {
    const subscriptions = new Set();

    return {
      add(subscription) {
        subscriptions.add(subscription);
        memoryManager.registerCleanup(this, () => {
          subscriptions.forEach(sub => {
            if (typeof sub.unsubscribe === 'function') {
              sub.unsubscribe();
            }
          });
          subscriptions.clear();
        });
      },

      unsubscribe(subscription) {
        if (subscriptions.has(subscription)) {
          if (typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
          subscriptions.delete(subscription);
        }
      },

      unsubscribeAll() {
        subscriptions.forEach(sub => {
          if (typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
          }
        });
        subscriptions.clear();
      }
    };
  }

  // Prevent WebSocket leaks
  static createWebSocketManager() {
    const sockets = new Map();

    return {
      create(url, protocols) {
        const ws = new WebSocket(url, protocols);
        sockets.set(ws, true);

        // Auto cleanup on close
        ws.addEventListener('close', () => {
          sockets.delete(ws);
        });

        // Register with memory manager
        memoryManager.registerCleanup(ws, () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        });

        return ws;
      },

      closeAll() {
        sockets.forEach((_, ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        });
        sockets.clear();
      }
    };
  }

  // Prevent media element leaks
  static createMediaManager() {
    const mediaElements = new WeakSet();

    return {
      register(element) {
        mediaElements.add(element);
        memoryManager.registerCleanup(element, () => {
          if (!element.paused) {
            element.pause();
          }
          element.src = '';
          element.load();
        });
      },

      pauseAll() {
        // Note: WeakSet doesn't allow iteration, so we can't pause all
        // Individual elements are cleaned up when components unmount
      }
    };
  }

  // Prevent canvas context leaks
  static createCanvasManager() {
    const canvases = new WeakSet();

    return {
      register(canvas) {
        canvases.add(canvas);
        memoryManager.registerCleanup(canvas, () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        });
      }
    };
  }

  // Performance monitoring helpers
  static monitorPerformance(componentName, operation) {
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    try {
      const result = operation();

      // If operation returns a promise, monitor it
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          this.logPerformanceMetrics(componentName, startTime, startMemory);
        });
      }

      // Synchronous operation
      this.logPerformanceMetrics(componentName, startTime, startMemory);
      return result;

    } catch (error) {
      this.logPerformanceMetrics(componentName, startTime, startMemory, error);
      throw error;
    }
  }

  static logPerformanceMetrics(componentName, startTime, startMemory, error = null) {
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;

    const metrics = {
      component: componentName,
      duration: Math.round(duration * 100) / 100,
      memoryDelta: memoryDelta,
      timestamp: Date.now(),
      error: error ? error.message : null
    };

    console.log(`📊 Performance [${componentName}]:`, metrics);

    // Store in memory manager for analysis
    if (!memoryManager.performanceMetrics) {
      memoryManager.performanceMetrics = [];
    }
    memoryManager.performanceMetrics.push(metrics);

    // Keep only last 100 metrics
    if (memoryManager.performanceMetrics.length > 100) {
      memoryManager.performanceMetrics.shift();
    }
  }

  // Global cleanup on page unload
  static initGlobalCleanup() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        console.log('🧹 Global cleanup initiated');

        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }

        // Take final memory snapshot
        memoryManager.takeMemorySnapshot('page-unload');
      });

      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Page is hidden, reduce activity
          console.log('📱 Page hidden, reducing activity');
          memoryManager.takeMemorySnapshot('page-hidden');
        } else {
          // Page is visible again
          console.log('📱 Page visible, resuming activity');
          memoryManager.takeMemorySnapshot('page-visible');
        }
      });
    }
  }
}

// Initialize global cleanup
LeakPrevention.initGlobalCleanup();

export default LeakPrevention;