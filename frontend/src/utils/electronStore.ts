/**
 * Electron Store - Web-only stub
 * 
 * Provides localStorage fallback for web mode.
 */

const isElectron = () => false;

export const electronStore = {
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    localStorage.clear();
  },

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
};

export default electronStore;
