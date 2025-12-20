/**
 * Electron Store Integration
 * Provides persistent storage for desktop app using electron-store
 * Provides persistence for usePersistedState hook
 */

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined;
};

import type { ElectronStoreAPI } from '../types/electron';

// Fallback to localStorage if not in Electron
class LocalStorageFallback implements ElectronStoreAPI {
  async get(key: string): Promise<unknown> {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async size(): Promise<number> {
    return localStorage.length;
  }

  async store(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        result[key] = value ? JSON.parse(value) : null;
      }
    }
    return result;
  }
}

// Get the appropriate store API
function getStoreAPI(): ElectronStoreAPI {
  if (isElectron() && window.electronAPI?.store) {
    return window.electronAPI.store;
  }
  return new LocalStorageFallback();
}

// Unified Store Interface
export const electronStore = {
  /**
   * Get a value from the store
   */
  async get<T = unknown>(key: string, defaultValue?: T): Promise<T> {
    const api = getStoreAPI();
    const value = await api.get(key);
    return (value !== undefined ? value : defaultValue) as T;
  },

  /**
   * Set a value in the store
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    const api = getStoreAPI();
    await api.set(key, value);
  },

  /**
   * Delete a value from the store
   */
  async delete(key: string): Promise<void> {
    const api = getStoreAPI();
    await api.delete(key);
  },

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    const api = getStoreAPI();
    return api.has(key);
  },

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    const api = getStoreAPI();
    await api.clear();
  },

  /**
   * Get the number of stored items
   */
  async size(): Promise<number> {
    const api = getStoreAPI();
    return api.size();
  },

  /**
   * Get all stored data
   */
  async getAll(): Promise<Record<string, unknown>> {
    const api = getStoreAPI();
    return api.store();
  },

  /**
   * Set multiple values at once
   */
  async setMany(entries: Record<string, unknown>): Promise<void> {
    const api = getStoreAPI();
    await Promise.all(
      Object.entries(entries).map(([key, value]) => api.set(key, value))
    );
  },

  /**
   * Delete multiple keys at once
   */
  async deleteMany(keys: string[]): Promise<void> {
    const api = getStoreAPI();
    await Promise.all(keys.map(key => api.delete(key)));
  },

  /**
   * Check if running in Electron
   */
  isElectron,
};

// Type augmentation for window object
declare global {
  interface Window {
    electronAPI: import('../types/electron').ElectronAPI;
  }
}

export default electronStore;
