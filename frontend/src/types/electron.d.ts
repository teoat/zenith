export interface ElectronAPI {
  // Core API methods
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  onReceive: (
    channel: string,
    func: (...args: unknown[]) => void,
  ) => () => void;

  // Authentication API
  isMasterPasswordSet: () => Promise<boolean>;
  startSessionListener: () => Promise<{ success: boolean; error?: string }>;
  onSessionStatusChanged: (
    callback: (status: { isValid: boolean }) => void,
  ) => () => void;
  logMemoryAlert?: (level: string, memoryUsage: unknown) => void;
  // Auth methods
  auth: {
    getProfile: () => Promise<unknown>;
    login: (credentials: unknown) => Promise<unknown>;
    logout: () => Promise<void>;
    getAuthStatus?: () => Promise<{
      success: boolean;
      data?: { isAuthenticated: boolean };
    }>;
    isMasterPasswordSet?: () => Promise<{
      success: boolean;
      data?: { isSet: boolean };
    }>;
  };
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;

  // System API
  getSystemInfo?: () => Promise<{
    platform: string;
    version: string;
    arch: string;
  }>;

  // Window management
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;

  // File system & Database (from utils/electron.ts)
  db?: {
    query: (sql: string, params?: unknown[]) => Promise<IPCResponse<unknown[]>>;
    execute: (sql: string, params?: unknown[]) => Promise<IPCResponse<unknown>>;
  };
  files?: {
    read: (path: string) => Promise<IPCResponse<string>>;
    write: (path: string, data: string) => Promise<IPCResponse<void>>;
  };
  store?: ElectronStoreAPI;

  // Evidence processing
  processEvidence?: (
    filePath: string,
  ) => Promise<import("../types/api").ProcessedEvidence>;
  selectFile?: () => Promise<import("../types/api").FileSelectResult>;

  // Security & system
  getSecurityStats?: () => Promise<unknown>;
  getSystemInfo?: () => Promise<{
    platform: string;
    version: string;
    arch: string;
  }>;

  // Window management
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
}

export interface ElectronStoreAPI {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
  store: () => Promise<Record<string, unknown>>;
}

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron?: ElectronAPI;
  }
}
