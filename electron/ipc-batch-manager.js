const { ipcRenderer } = require('electron');

// IPC Batching and Caching System
class IPCBatchManager {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 100; // ms
    this.cacheEnabled = options.cacheEnabled !== false;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes default

    this.batches = new Map();
    this.cache = new Map();
    this.pendingPromises = new Map();

    // Start batch processing
    this.startBatchProcessor();
  }

  // Cache management
  getCacheKey(channel, data) {
    // Create a deterministic cache key from channel and data
    const dataStr = JSON.stringify(data, Object.keys(data).sort());
    return `${channel}:${dataStr}`;
  }

  getCachedResult(cacheKey) {
    if (!this.cacheEnabled) return null;

    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  setCachedResult(cacheKey, result) {
    if (!this.cacheEnabled) return;

    this.cache.set(cacheKey, {
      result: JSON.parse(JSON.stringify(result)), // Deep clone
      timestamp: Date.now()
    });

    // Limit cache size to prevent memory leaks
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Batch processing
  startBatchProcessor() {
    setInterval(() => {
      this.processBatches();
    }, this.batchTimeout);
  }

  async processBatches() {
    for (const [channel, batch] of this.batches) {
      if (batch.requests.length > 0) {
        await this.executeBatch(channel, batch);
      }
    }
  }

  async executeBatch(channel, batch) {
    const requests = batch.requests.splice(0); // Clear batch
    const batchId = `${channel}_${Date.now()}_${Math.random()}`;

    try {
      // Execute batch request
      const batchResult = await ipcRenderer.invoke('batch-ipc', {
        batchId,
        channel,
        requests
      });

      // Resolve individual promises
      requests.forEach((request, index) => {
        const result = batchResult.results[index];
        if (result.success) {
          request.resolve(result.data);
        } else {
          request.reject(new Error(result.error));
        }
      });

    } catch (error) {
      // Reject all promises in batch
      requests.forEach(request => {
        request.reject(error);
      });
    }
  }

  // Public API
  async invoke(channel, data, options = {}) {
    const {
      skipCache = false,
      forceIndividual = false,
      cacheTTL
    } = options;

    // Check cache first
    if (!skipCache) {
      const cacheKey = this.getCacheKey(channel, data);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    // Check if this channel supports batching
    const supportsBatching = this.supportsBatching(channel);

    if (!forceIndividual && supportsBatching) {
      return this.batchInvoke(channel, data, cacheTTL);
    } else {
      return this.individualInvoke(channel, data, cacheTTL);
    }
  }

  async batchInvoke(channel, data, cacheTTL) {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(channel)) {
        this.batches.set(channel, { requests: [] });
      }

      const batch = this.batches.get(channel);
      batch.requests.push({
        data,
        resolve,
        reject,
        cacheTTL
      });

      // If batch is full, process immediately
      if (batch.requests.length >= this.batchSize) {
        this.executeBatch(channel, batch);
      }
    });
  }

  async individualInvoke(channel, data, cacheTTL) {
    try {
      const result = await ipcRenderer.invoke(channel, data);

      // Cache the result
      if (cacheTTL !== 0) {
        const cacheKey = this.getCacheKey(channel, data);
        this.setCachedResult(cacheKey, result);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  supportsBatching(channel) {
    // Define which channels support batching
    const batchableChannels = [
      'secure-cases',
      'secure-evidence',
      'secure-reconciliation'
    ];

    return batchableChannels.includes(channel);
  }

  // Cache management methods
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear cache entries matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      channels: Array.from(this.cache.keys()).map(key => key.split(':')[0]),
      memoryUsage: JSON.stringify(Array.from(this.cache.values())).length
    };
  }

  // Batch statistics
  getBatchStats() {
    const stats = {};
    for (const [channel, batch] of this.batches) {
      stats[channel] = {
        pendingRequests: batch.requests.length,
        batchSize: this.batchSize
      };
    }
    return stats;
  }
}

// Create singleton instance
const ipcBatchManager = new IPCBatchManager({
  batchSize: 10,
  batchTimeout: 100,
  cacheEnabled: true,
  cacheTTL: 300000 // 5 minutes
});

// Enhanced IPC client with batching and caching
class EnhancedIPCRenderer {
  constructor() {
    this.batchManager = ipcBatchManager;
  }

  // Enhanced invoke with batching and caching
  async invokeSecure(channel, data, options = {}) {
    return this.batchManager.invoke(channel, data, options);
  }

  // Cache management
  clearCache(pattern = null) {
    return this.batchManager.clearCache(pattern);
  }

  getCacheStats() {
    return this.batchManager.getCacheStats();
  }

  getBatchStats() {
    return this.batchManager.getBatchStats();
  }

  // Force individual call (bypass batching)
  async invokeIndividual(channel, data, options = {}) {
    return this.batchManager.invoke(channel, data, { ...options, forceIndividual: true });
  }

  // Skip cache for this call
  async invokeNoCache(channel, data, options = {}) {
    return this.batchManager.invoke(channel, data, { ...options, skipCache: true });
  }
}

const enhancedIPC = new EnhancedIPCRenderer();

module.exports = { IPCBatchManager, EnhancedIPCRenderer, enhancedIPC };