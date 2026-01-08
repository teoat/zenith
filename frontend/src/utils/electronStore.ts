/**
 * Web Store - LocalStorage Abstraction
 *
 * Provides a consistent API for local persistence using localStorage.
 */

export const webStore = {
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      try {
        return JSON.parse(item) as T;
      } catch {
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
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to set key "${key}":`, error);
      return false;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Failed to delete key "${key}":`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("[Storage] Failed to clear storage:", error);
    }
  },

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  },
};

export default webStore;
