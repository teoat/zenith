import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { api } from '../lib/api';
import { QueuedRequest, OfflineQueueContext } from '../context/OfflineQueueContext';

const QUEUE_STORAGE_KEY = 'offline_mutation_queue';

export const OfflineQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedRequest[]>(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { // Ignore parse errors
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Save queue to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Listen for storage events (triggered by api.ts or other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
        const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (storedQueue) {
            try {
                // We should only update if it's different to prevent loops, 
                // but for now simple setQueue is fine as Re-render is cheap
                setQueue(JSON.parse(storedQueue));
            } catch(_e) { // Renamed to _e
                // Ignore storage parse errors
            }
        }
    };
    
    // api.ts dispatches this manually on window
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToQueue = (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
    setQueue((prev) => {
      if (prev.length >= 50) {
        console.warn('[OfflineQueue] Queue limit reached (50 items). Dropping oldest request.');
        const [, ...rest] = prev;
        return [...rest, {
          ...request,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }];
      }
      return [...prev, {
        ...request,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }];
    });
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((req) => req.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  // Sync logic
  useEffect(() => {
    if (!isOnline || isSyncing) return;

    const syncQueue = async () => {
      setIsSyncing(true);
      const currentQueue = queue.filter(req => !req.synced);

      for (const req of currentQueue) {
        try {
          console.log(`[OfflineQueue] Replaying request: ${req.method} (ID: ${req.id})`);

          // Dynamically invoke API method
          // @ts-expect-error - Dynamic method invocation
          if (typeof api[req.method] === 'function') {
            // @ts-expect-error - spread args safely
            await api[req.method](...req.body); // body is assumed to be args array
            console.log(`[OfflineQueue] Request ${req.id} succeeded`);
            removeFromQueue(req.id);
          } else {
            console.error(`[OfflineQueue] Unknown API method: ${req.method}`);
            // Drop invalid requests to prevent blocking
            removeFromQueue(req.id);
          }

        } catch (error) {
          console.error(`[OfflineQueue] Request ${req.id} failed`, error);
          // Stop syncing on error to preserve order
          break;
        }
      }

      setIsSyncing(false);
    };

    syncQueue();
  }, [isOnline, queue, isSyncing]);

  return (
    <OfflineQueueContext.Provider
      value={{ queue, addToQueue, removeFromQueue, clearQueue, isSyncing }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
};
