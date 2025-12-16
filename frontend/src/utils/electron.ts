// Type definitions for window.electronAPI
export interface ElectronAPI {
  db: {
    query: (sql: string, params?: unknown[]) => Promise<IPCResponse<unknown[]>>;
    execute: (sql: string, params?: unknown[]) => Promise<IPCResponse<ExecuteResult>>;
  };
  files: {
    read: (path: string) => Promise<IPCResponse<string>>;
    write: (path: string, data: string) => Promise<IPCResponse<void>>;
    openDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => string;
    getPath: (name: 'home' | 'appData' | 'userData' | 'downloads') => Promise<string>;
  };
  auth?: {
    isMasterPasswordSet: () => Promise<IPCResponse<{ isSet: boolean }>>;
    setMasterPassword: (password: string) => Promise<IPCResponse<void>>;
    authenticate: (password: string) => Promise<IPCResponse<void>>;
    isAuthenticated: () => Promise<IPCResponse<{ authenticated: boolean }>>;
    logout: () => Promise<IPCResponse<void>>;
    changeMasterPassword: (current: string, newPass: string) => Promise<IPCResponse<void>>;
    enableBiometric: () => Promise<IPCResponse<void>>;
    authenticateBiometric: () => Promise<IPCResponse<void>>;
    getAuthStatus: () => Promise<IPCResponse<{ isAuthenticated: boolean }>>;
  };
  on: (channel: string, callback: (...args: unknown[]) => void) => (() => void) | undefined;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
  // Window controls
  minimizeWindow?: () => Promise<void>;
  maximizeWindow?: () => Promise<void>;
  closeWindow?: () => Promise<void>;
}

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

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
