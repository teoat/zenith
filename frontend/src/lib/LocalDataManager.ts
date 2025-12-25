// frontend/src/lib/LocalDataManager.ts
// Local data management for offline-first functionality
import React from 'react';
import { secureLogger } from '../utils/secureLogger';
import { secureRandom } from '../utils/secureRandom';

interface StoredItem<T> {
  id: string;
  data: T;
  timestamp: number;
  version: number;
  synced: boolean;
  syncAttempts: number;
  lastSyncError?: string;
}

interface SyncOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: T;
  timestamp: number;
  synced: boolean;
  lastSyncError?: string;
  syncAttempts?: number;
}

export class LocalDataManager {
  private db: IDBDatabase | null = null;
  private dbName = 'zenithLocalDB';
  private dbVersion = 1;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        secureLogger.error('Failed to open local database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Collections store
        if (!db.objectStoreNames.contains('collections')) {
          const collectionsStore = db.createObjectStore('collections', { keyPath: 'id' });
          collectionsStore.createIndex('collection', 'collection', { unique: false });
          collectionsStore.createIndex('synced', 'synced', { unique: false });
          collectionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync operations store
        if (!db.objectStoreNames.contains('syncOperations')) {
          const syncStore = db.createObjectStore('syncOperations', { keyPath: 'id' });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  // Collection operations
  async store<T>(collection: string, id: string, data: T): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections'], 'readwrite');
    const store = transaction.objectStore('collections');

    const item: StoredItem<T> = {
      id: `${collection}:${id}`,
      data: { ...data, id },
      timestamp: Date.now(),
      version: 1,
      synced: false,
      syncAttempts: 0
    };

    // Check if item exists and update version
    const existing = await this.get<T>(collection, id);
    if (existing) {
      item.version = existing.version + 1;
    }

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(collection: string, id: string): Promise<StoredItem<T> | null> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections'], 'readonly');
    const store = transaction.objectStore('collections');

    return new Promise((resolve, reject) => {
      const request = store.get(`${collection}:${id}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(collection: string): Promise<StoredItem<T>[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections'], 'readonly');
    const store = transaction.objectStore('collections');
    const index = store.index('collection');

    return new Promise((resolve, reject) => {
      const request = index.getAll(collection);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections'], 'readwrite');
    const store = transaction.objectStore('collections');

    return new Promise((resolve, reject) => {
      const request = store.delete(`${collection}:${id}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearCollection(collection: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections'], 'readwrite');
    const store = transaction.objectStore('collections');
    const index = store.index('collection');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(collection));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync operations
  async queueSyncOperation<T>(operation: Omit<SyncOperation<T>, 'id' | 'timestamp' | 'synced' | 'lastSyncError' | 'syncAttempts'>): Promise<string> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncOperations'], 'readwrite');
    const store = transaction.objectStore('syncOperations');

    const syncOp: SyncOperation<T> = {
      ...operation,
      id: `sync-${Date.now()}-${secureRandom.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
      syncAttempts: 0 // Initialize syncAttempts
    };

    return new Promise((resolve, reject) => {
      const request = store.put(syncOp);
      request.onsuccess = () => resolve(syncOp.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncOperations<T>(): Promise<SyncOperation<T>[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncOperations'], 'readonly');
    const store = transaction.objectStore('syncOperations');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(false));
      const results: SyncOperation<T>[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markSyncOperationComplete(operationId: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncOperations'], 'readwrite');
    const store = transaction.objectStore('syncOperations');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(operationId);
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.synced = true;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Operation not found, consider it complete
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async markSyncOperationFailed(operationId: string, error: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncOperations'], 'readwrite');
    const store = transaction.objectStore('syncOperations');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(operationId);
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.lastSyncError = error;
          operation.syncAttempts = (operation.syncAttempts || 0) + 1;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Metadata operations
  async setMetadata<T>(key: string, value: T): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata<T>(key: string): Promise<T | undefined> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk operations
  async bulkStore<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections'], 'readwrite');
    const store = transaction.objectStore('collections');

    const promises = items.map(({ id, data }) => {
      const item: StoredItem<T> = {
        id: `${collection}:${id}`,
        data: { ...data, id },
        timestamp: Date.now(),
        version: 1,
        synced: false,
        syncAttempts: 0
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  // Sync status and statistics
  async getStorageStats(): Promise<{
    collections: { [key: string]: number };
    totalItems: number;
    pendingSync: number;
    storageSize: number;
  }> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const collections: { [key: string]: number } = {};
    let totalItems = 0;
    let pendingSync = 0;

    // Count collections
    const transaction = this.db.transaction(['collections'], 'readonly');
    const store = transaction.objectStore('collections');

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          totalItems++;
          const key = cursor.key as string;
          const collection = key.split(':')[0];

          collections[collection] = (collections[collection] || 0) + 1;

          if (!cursor.value.synced) {
            pendingSync++;
          }

          cursor.continue();
        } else {
          // Get sync operations count
          const syncTransaction = this.db!.transaction(['syncOperations'], 'readonly');
          const syncStore = syncTransaction.objectStore('syncOperations');
          const syncIndex = syncStore.index('synced');

          const syncRequest = syncIndex.openCursor();
          let syncCount = 0;
          syncRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              if (!cursor.value.synced) syncCount++;
              cursor.continue();
            } else {
              pendingSync += syncCount;

              // Estimate storage size (rough approximation)
              const estimatedSize = totalItems * 1024; // ~1KB per item

              resolve({
                collections,
                totalItems,
                pendingSync,
                storageSize: estimatedSize
              });
            }
          };
          syncRequest.onerror = () => reject(syncRequest.error);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup operations
  async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const cutoff = Date.now() - maxAge;
    let deletedCount = 0;

    const transaction = this.db.transaction(['collections'], 'readwrite');
    const store = transaction.objectStore('collections');

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoff && cursor.value.synced) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['collections', 'syncOperations', 'metadata'], 'readwrite');

    const promises = [
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('collections').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('syncOperations').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('metadata').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ];

    await Promise.all(promises);
  }
}

// React hook for local data management
export function useLocalData<T>(collection: string) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const manager = React.useMemo(() => new LocalDataManager(), []);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await manager.getAll<T>(collection);
      setData(items.map(item => item.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [collection, manager]);

  const saveItem = React.useCallback(async (id: string, itemData: T) => {
    try {
      await manager.store<T>(collection, id, itemData);
      await loadData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
      throw err;
    }
  }, [collection, manager, loadData]);

  const deleteItem = React.useCallback(async (id: string) => {
    try {
      await manager.delete(collection, id);
      await loadData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [collection, manager, loadData]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    saveItem,
    deleteItem,
    refresh: loadData
  };
}

// Global instance
export const localDataManager = new LocalDataManager();