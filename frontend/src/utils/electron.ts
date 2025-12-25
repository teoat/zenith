import type { ElectronAPI } from '../types/electron';

export interface ExecuteResult {
  changes: number;
  lastInsertRowid: number;
}



/**
 * Check if running in Electron environment
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

/**
 * Get ElectronAPI (throws if not in Electron)
 */
export const getElectronAPI = (): ElectronAPI => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }
  return window.electronAPI as ElectronAPI;
};

/**
 * Safe database query with error handling
 */
export const dbQuery = async <T = unknown>(sql: string, params?: unknown[]): Promise<T[]> => {
  const api = getElectronAPI();
  if (!api.db) throw new Error('Database API not available');
  const result = await api.db.query(sql, params);
  
  if (!result.success) {
    throw new Error(result.error || 'Database query failed');
  }
  
  return result.data as T[];
};

/**
 * Safe database execute with error handling
 */
export const dbExecute = async (sql: string, params?: unknown[]): Promise<ExecuteResult> => {
  const api = getElectronAPI();
  if (!api.db) throw new Error('Database API not available');
  const result = await api.db.execute(sql, params);
  
  if (!result.success) {
    throw new Error(result.error || 'Database execute failed');
  }
  
  return result.data!; // data cannot be undefined if success is true, but safer to check.
};

export default {
  isElectron,
  getElectronAPI,
  dbQuery,
  dbExecute
};
