// electron/offline-sync.js
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');
const ConflictResolver = require('./conflict-resolver');

// Simple API service for offline sync operations
class APIService {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const url = new URL('/health', this.baseURL);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  async getCase(caseId) {
    return this.makeRequest(`/api/cases/${caseId}`);
  }

  async createCase(caseData) {
    return this.makeRequest('/api/cases', 'POST', caseData);
  }

  async updateCase(caseId, caseData) {
    return this.makeRequest(`/api/cases/${caseId}`, 'PUT', caseData);
  }

  async createTransaction(transactionData) {
    return this.makeRequest('/api/transactions', 'POST', transactionData);
  }

  async updateEvidence(evidenceId, evidenceData) {
    return this.makeRequest(`/api/evidence/${evidenceId}`, 'PUT', evidenceData);
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseURL);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(body));
            } else {
              reject({ status: res.statusCode, message: body });
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }
}

class OfflineSyncManager extends EventEmitter {
  constructor(ipcMain, dbService, apiService) {
    super();
    this.ipcMain = ipcMain;
    this.dbService = dbService;
    this.apiService = apiService || new APIService();

    this.isOnline = true; // Assume online initially, will be checked
    this.syncQueue = [];
    this.conflictResolver = new ConflictResolver();
    this.syncInProgress = false;
    this.conflicts = new Map(); // Store active conflicts

    this.setupNetworkMonitoring();
    this.setupIPCHandlers();
    this.loadPersistedQueue();
  }

  setupNetworkMonitoring() {
    // Periodic connectivity checks (no browser events in Node.js)
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds

    // Initial connectivity check
    this.checkConnectivity();
  }

  async checkConnectivity() {
    try {
      // Check connectivity to backend API
      const isHealthy = await this.checkBackendHealth();
      const wasOffline = !this.isOnline;
      this.isOnline = isHealthy;

      if (wasOffline && this.isOnline) {
        this.emit('network-online');
        this.startSync();
      } else if (!wasOffline && !this.isOnline) {
        this.emit('network-offline');
      }
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false;
        this.emit('network-offline');
      }
    }
  }

  async checkBackendHealth() {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 8000, // Backend port
        path: '/health',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  setupIPCHandlers() {
    // Queue operations for offline sync
    this.ipcMain.handle('queue-offline-operation', async (event, operation) => {
      return this.queueOperation(operation);
    });

    // Get sync status
    this.ipcMain.handle('get-sync-status', async () => {
      return this.getSyncStatus();
    });

    // Force sync
    this.ipcMain.handle('force-sync', async () => {
      return this.startSync(true);
    });

    // Resolve conflicts
    this.ipcMain.handle('resolve-conflict', async (event, conflictId, resolution) => {
      return this.resolveConflict(conflictId, resolution);
    });
  }

  async queueOperation(operation) {
    const queuedOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      status: 'queued',
      retryCount: 0
    };

    this.syncQueue.push(queuedOperation);
    await this.persistQueue();

    this.emit('operation-queued', queuedOperation);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.startSync();
    }

    return queuedOperation.id;
  }

  async startSync(force = false) {
    if (!this.isOnline || (this.syncInProgress && !force)) {
      return { status: 'skipped', reason: 'offline or sync in progress' };
    }

    this.syncInProgress = true;
    this.emit('sync-started');

    try {
      const results = await this.processSyncQueue();
      await this.persistQueue();

      this.emit('sync-completed', results);
      return { status: 'completed', results };

    } catch (error) {
      this.emit('sync-error', error);
      return { status: 'error', error: error.message };

    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncQueue() {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      conflicts: 0,
      skipped: 0
    };

    // Sort by timestamp (oldest first)
    this.syncQueue.sort((a, b) => a.timestamp - b.timestamp);

    for (const queuedOp of this.syncQueue) {
      if (queuedOp.status === 'completed') {
        results.skipped++;
        continue;
      }

      results.processed++;

      try {
        const result = await this.executeOperation(queuedOp);

        if (result.conflict) {
          queuedOp.status = 'conflict';
          queuedOp.conflictData = result.conflictData;
          results.conflicts++;

          // Store conflict for resolution
          this.conflicts.set(queuedOp.id, {
            operation: queuedOp,
            conflictData: result.conflictData,
            detectedAt: Date.now()
          });

          this.emit('conflict-detected', {
            operationId: queuedOp.id,
            conflict: result.conflictData
          });
        } else {
          queuedOp.status = 'completed';
          results.successful++;
          this.emit('operation-synced', queuedOp);
        }

      } catch (error) {
        queuedOp.retryCount++;
        queuedOp.lastError = error.message;

        if (queuedOp.retryCount >= 3) {
          queuedOp.status = 'failed';
          results.failed++;
          this.emit('operation-failed', {
            operation: queuedOp,
            error: error.message
          });
        } else {
          // Will retry on next sync
          results.failed++;
        }
      }
    }

    return results;
  }

  async executeOperation(queuedOp) {
    const { operation } = queuedOp;

    switch (operation.type) {
      case 'create-case':
        return await this.syncCreateCase(operation.data);

      case 'update-case':
        return await this.syncUpdateCase(operation.data);

      case 'create-transaction':
        return await this.syncCreateTransaction(operation.data);

      case 'update-evidence':
        return await this.syncUpdateEvidence(operation.data);

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  async syncCreateCase(caseData) {
    // Check if case already exists remotely
    try {
      const existingCase = await this.apiService.getCase(caseData.id);

      if (existingCase) {
        // Conflict - case exists remotely
        return {
          conflict: true,
          conflictData: {
            type: 'case-exists',
            local: caseData,
            remote: existingCase,
            resolution: 'merge' // Default resolution strategy
          }
        };
      }

      // Create remotely
      await this.apiService.createCase(caseData);
      return { success: true };

    } catch (error) {
      if (error.status === 404) {
        // Case doesn't exist remotely, create it
        await this.apiService.createCase(caseData);
        return { success: true };
      }
      throw error;
    }
  }

  async syncUpdateCase(caseData) {
    try {
      const remoteCase = await this.apiService.getCase(caseData.id);

      if (this.hasConflict(caseData, remoteCase)) {
        return {
          conflict: true,
          conflictData: {
            type: 'case-update-conflict',
            local: caseData,
            remote: remoteCase,
            resolution: 'last-write-wins'
          }
        };
      }

      // No conflict, update remotely
      await this.apiService.updateCase(caseData.id, caseData);
      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  async syncCreateTransaction(transactionData) {
    // Similar logic for transactions
    try {
      // For transactions, we might need to check for duplicates
      // This is simplified - in reality you'd check for similar transactions
      await this.apiService.createTransaction(transactionData);
      return { success: true };
    } catch (error) {
      if (error.status === 409) { // Conflict - duplicate
        return {
          conflict: true,
          conflictData: {
            type: 'duplicate-transaction',
            local: transactionData,
            resolution: 'skip'
          }
        };
      }
      throw error;
    }
  }

  async syncUpdateEvidence(evidenceData) {
    // Evidence updates are typically append-only
    try {
      await this.apiService.updateEvidence(evidenceData.id, evidenceData);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  hasConflict(localData, remoteData) {
    // Simple conflict detection based on timestamps
    const localTime = new Date(localData.updatedAt || localData.createdAt);
    const remoteTime = new Date(remoteData.updatedAt || remoteData.createdAt);

    // If remote is newer, there's a conflict
    return remoteTime > localTime;
  }

  async resolveConflict(conflictId, resolution) {
    const conflictEntry = this.conflicts.get(conflictId);

    if (!conflictEntry) {
      throw new Error('Conflict not found');
    }

    const { operation, conflictData } = conflictEntry;

    try {
      // Analyze conflict for better resolution
      const analysis = this.conflictResolver.analyzeConflict(conflictData);

      // Apply resolution
      const resolvedData = await this.conflictResolver.resolve(conflictData, resolution);

      if (resolvedData) {
        // Execute the resolved operation
        await this.executeOperation({
          ...operation,
          operation: { ...operation.operation, data: resolvedData }
        });

        operation.status = 'completed';
        operation.resolvedAt = Date.now();
        operation.resolution = resolution;
        operation.conflictAnalysis = analysis;
      } else {
        // Resolution resulted in no action (e.g., manual resolution needed)
        operation.status = 'pending-manual-review';
        operation.resolution = resolution;
      }

      // Remove from active conflicts
      this.conflicts.delete(conflictId);

      await this.persistQueue();
      this.emit('conflict-resolved', {
        conflictId,
        resolution,
        analysis,
        resolvedData
      });

      return { success: true, resolvedData, analysis };

    } catch (error) {
      operation.status = 'failed';
      operation.lastError = `Conflict resolution failed: ${error.message}`;

      await this.persistQueue();
      throw error;
    }
  }

  getSyncStatus() {
    const queued = this.syncQueue.filter(op => op.status === 'queued').length;
    const conflicts = this.syncQueue.filter(op => op.status === 'conflict').length;
    const failed = this.syncQueue.filter(op => op.status === 'failed').length;
    const pendingManual = this.syncQueue.filter(op => op.status === 'pending-manual-review').length;

    // Get active conflicts with analysis
    const activeConflicts = Array.from(this.conflicts.entries()).map(([id, entry]) => ({
      id,
      type: entry.conflictData.type,
      severity: this.conflictResolver.analyzeConflict(entry.conflictData).severity,
      detectedAt: entry.detectedAt,
      analysis: this.conflictResolver.analyzeConflict(entry.conflictData)
    }));

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      queued,
      conflicts,
      failed,
      pendingManual,
      activeConflicts,
      lastSyncAttempt: this.lastSyncAttempt,
      lastSyncResult: this.lastSyncResult
    };
  }

  async persistQueue() {
    try {
      const queuePath = path.join(app.getPath('userData'), 'sync-queue.json');
      await fs.writeFile(queuePath, JSON.stringify(this.syncQueue, null, 2));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  async loadPersistedQueue() {
    try {
      const queuePath = path.join(app.getPath('userData'), 'sync-queue.json');
      const queueData = await fs.readFile(queuePath, 'utf8');
      this.syncQueue = JSON.parse(queueData);

      // Clean up old completed operations (keep last 100)
      const completedOps = this.syncQueue.filter(op => op.status === 'completed');
      if (completedOps.length > 100) {
        const opsToRemove = completedOps.slice(0, completedOps.length - 100);
        this.syncQueue = this.syncQueue.filter(op => !opsToRemove.includes(op));
      }

    } catch (error) {
      // No persisted queue or error reading it
      this.syncQueue = [];
    }
  }

  // Clean up old operations
  cleanupOldOperations(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoff = Date.now() - maxAge;
    const initialLength = this.syncQueue.length;

    this.syncQueue = this.syncQueue.filter(op => {
      // Keep failed operations for manual review
      if (op.status === 'failed') return true;

      // Keep operations newer than cutoff
      return op.timestamp > cutoff;
    });

    const removed = initialLength - this.syncQueue.length;
    if (removed > 0) {
      console.log(`Cleaned up ${removed} old sync operations`);
      this.persistQueue();
    }
  }
}



module.exports = OfflineSyncManager;