/**
 * Electron Store - Unified Storage Abstraction
 * 
 * Provides a consistent API for local persistence, handling:
 * - Electron Store (when available)
 * - LocalStorage fallback (web mode)
 * - JSON serialization/deserialization control
 * - Error handling
 */

const isElectron = () => {
    return typeof window !== 'undefined' && 
           window.electron !== undefined;
};

export const electronStore = {
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      if (isElectron()) {
          // Native bridge call would go here
          // return await window.electron.store.get(key, defaultValue);
          // For now, fallback to localStorage even in electron stub untill bridge is ready
      }
      
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      try {
        return JSON.parse(item) as T;
      } catch {
        // Handle raw string values gracefully if they weren't JSON stringified
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`[Storage] Failed to get key "${key}":`, error);
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      
      if (isElectron()) {
          // window.electron.store.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to set key "${key}":`, error);
      return false;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      if (isElectron()) {
          // window.electron.store.delete(key);
      }
    } catch (error) {
       console.error(`[Storage] Failed to delete key "${key}":`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      localStorage.clear();
      if (isElectron()) {
          // window.electron.store.clear();
      }
    } catch (error) {
        console.error('[Storage] Failed to clear storage:', error);
    }
  },

  async has(key: string): Promise<boolean> {
     return localStorage.getItem(key) !== null;
  }
};

export default electronStore;
