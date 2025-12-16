// electron/ipc-optimizer.js
const EventEmitter = require('events');

class IPCOptimizer extends EventEmitter {
  constructor(ipcMain, options = {}) {
    super();
    this.ipcMain = ipcMain;
    this.cache = new Map();
    this.batchQueue = new Map();
    this.batchTimeout = options.batchTimeout || 50; // 50ms batch window
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes
    this.maxBatchSize = options.maxBatchSize || 10;
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      batchesProcessed: 0,
      averageBatchSize: 0,
      totalRequests: 0
    };

    this.setupBatchProcessing();
    this.setupCacheCleanup();
  }

  /**
   * Register an IPC handler with optimization
   */
  handle(channel, handler, options = {}) {
    const optimizedHandler = this.createOptimizedHandler(channel, handler, options);
    this.ipcMain.handle(channel, optimizedHandler);

    // Also handle batched version
    this.ipcMain.handle(`batch-${channel}`, async (event, batchData) => {
      return this.processBatch(channel, batchData, handler);
    });
  }

  /**
   * Create an optimized handler with caching and batching
   */
  createOptimizedHandler(channel, handler, options) {
    return async (event, data) => {
      const startTime = Date.now();
      this.metrics.totalRequests++;

      try {
        // Check cache first
        const cacheKey = this.generateCacheKey(channel, data);
        const cachedResult = this.getCachedResult(cacheKey);

        if (cachedResult !== null) {
          this.metrics.cacheHits++;
          this.emit('cache-hit', { channel, cacheKey, duration: Date.now() - startTime });
          return cachedResult;
        }

        this.metrics.cacheMisses++;

        // Execute handler
        const result = await handler(event, data);

        // Cache result if cacheable
        if (this.isCacheable(channel, options)) {
          this.setCachedResult(cacheKey, result, options.cacheTimeout || this.cacheTimeout);
        }

        this.emit('request-completed', {
          channel,
          duration: Date.now() - startTime,
          cached: false
        });

        return result;

      } catch (error) {
        this.emit('request-error', {
          channel,
          error: error.message,
          duration: Date.now() - startTime
        });
        throw error;
      }
    };
  }

  /**
   * Process a batch of requests
   */
  async processBatch(channel, batchData, handler) {
    const { requests, batchId } = batchData;
    const startTime = Date.now();

    this.metrics.batchesProcessed++;
    this.metrics.averageBatchSize = (
      (this.metrics.averageBatchSize * (this.metrics.batchesProcessed - 1)) + requests.length
    ) / this.metrics.batchesProcessed;

    try {
      // Process batch in parallel with concurrency control
      const results = await this.processBatchParallel(requests, handler, 3); // Max 3 concurrent

      const duration = Date.now() - startTime;
      this.emit('batch-completed', {
        channel,
        batchId,
        requestCount: requests.length,
        duration
      });

      return {
        batchId,
        results,
        metadata: {
          processedAt: new Date().toISOString(),
          duration,
          requestCount: requests.length
        }
      };

    } catch (error) {
      this.emit('batch-error', {
        channel,
        batchId,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Process batch requests in parallel with concurrency control
   */
  async processBatchParallel(requests, handler, concurrency = 3) {
    const results = [];
    const semaphore = new Semaphore(concurrency);

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(async (request, index) => {
        const release = await semaphore.acquire();
        try {
          // Create mock event for handler compatibility
          const mockEvent = { sender: { id: 'batch-processor' } };
          const result = await handler(mockEvent, request.data);
          return { index: i + index, result, success: true };
        } catch (error) {
          return { index: i + index, error: error.message, success: false };
        } finally {
          release();
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Sort results back to original order
    return results.sort((a, b) => a.index - b.index);
  }

  /**
   * Queue a request for batching
   */
  queueForBatch(channel, data, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(channel)) {
        this.batchQueue.set(channel, []);
      }

      const queue = this.batchQueue.get(channel);
      const requestId = `${channel}-${Date.now()}-${Math.random()}`;

      queue.push({
        id: requestId,
        data,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Trigger batch processing if queue is full
      if (queue.length >= this.maxBatchSize) {
        this.processQueuedBatch(channel);
      }
    });
  }

  /**
   * Process queued batch requests
   */
  async processQueuedBatch(channel) {
    const queue = this.batchQueue.get(channel);
    if (!queue || queue.length === 0) return;

    // Remove from queue
    this.batchQueue.set(channel, []);
    const requests = queue.map(item => ({ id: item.id, data: item.data }));

    try {
      // Process batch
      const batchResult = await this.ipcMain.invokeMain(`batch-${channel}`, {
        requests,
        batchId: `queue-${Date.now()}`
      });

      // Resolve individual promises
      batchResult.results.forEach((result, index) => {
        const queueItem = queue[index];
        if (result.success) {
          queueItem.resolve(result.result);
        } else {
          queueItem.reject(new Error(result.error));
        }
      });

    } catch (error) {
      // Reject all queued requests
      queue.forEach(item => item.reject(error));
    }
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(channel, data) {
    // Create a deterministic key from channel and data
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return `${channel}:${Buffer.from(dataString).toString('base64').substring(0, 32)}`;
  }

  /**
   * Check if result is cached
   */
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache a result
   */
  setCachedResult(cacheKey, data, ttl = this.cacheTimeout) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Check if a channel/handler is cacheable
   */
  isCacheable(channel, options) {
    // Default cacheable channels
    const cacheableChannels = [
      'get-cases',
      'get-evidence',
      'get-settings',
      'get-system-info'
    ];

    // Check options override
    if (options.cacheable === false) return false;
    if (options.cacheable === true) return true;

    return cacheableChannels.includes(channel);
  }

  /**
   * Set up periodic batch processing
   */
  setupBatchProcessing() {
    this.batchInterval = setInterval(() => {
      // Process all queued batches
      for (const channel of this.batchQueue.keys()) {
        this.processQueuedBatch(channel);
      }
    }, this.batchTimeout);
  }

  /**
   * Set up cache cleanup
   */
  setupCacheCleanup() {
    // Clean expired cache entries every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.emit('cache-cleaned', { entriesRemoved: cleaned });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const cacheHitRate = this.metrics.totalRequests > 0
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100
      : 0;

    return {
      ...this.metrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      cacheSize: this.cache.size,
      activeBatches: Array.from(this.batchQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cache-cleared', { entriesRemoved: size });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.cache.clear();
    this.batchQueue.clear();
    this.removeAllListeners();
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.currentConcurrent = 0;
    this.waitQueue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentConcurrent < this.maxConcurrent) {
        this.currentConcurrent++;
        resolve(this.release.bind(this));
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release() {
    this.currentConcurrent--;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.currentConcurrent++;
      resolve(this.release.bind(this));
    }
  }
}

module.exports = IPCOptimizer;