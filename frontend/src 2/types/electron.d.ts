// Type definitions for Electron API exposed via contextBridge

interface ElectronAuthAPI {
  setMasterPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  authenticate: (password: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: () => Promise<{ success: boolean; data: { authenticated: boolean } }>;
  logout: () => Promise<{ success: boolean }>;
  changeMasterPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  enableBiometric: () => Promise<{ success: boolean; error?: string }>;
  authenticateBiometric: () => Promise<{ success: boolean; error?: string }>;
  getAuthStatus: () => Promise<{ success: boolean; data: { isAuthenticated: boolean } }>;
  isMasterPasswordSet: () => Promise<{ success: boolean; data: { isSet: boolean } }>;
}

interface ElectronDBAPI {
  query: (sql: string, params?: unknown[]) => Promise<{ success: boolean; data: unknown[] }>;
  execute: (sql: string, params?: unknown[]) => Promise<{ success: boolean }>;
}

interface ElectronFilesAPI {
  read: (path: string) => Promise<{ success: boolean; data: string }>;
  write: (path: string, data: string) => Promise<{ success: boolean }>;
  openDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
}

interface ElectronAppAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => string;
  getPath: (name: string) => Promise<string>;
}

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  memory?: {
    total: number;
    free: number;
  };
}

interface ProcessedEvidence {
  fileType: string;
  sizeBytes: number;
  ocrText?: string;
}

interface SecurityStatsData {
  encryptionEnabled: boolean;
  secureStorage: boolean;
}

interface ElectronAPI {
  auth: ElectronAuthAPI;
  db: ElectronDBAPI;
  files: ElectronFilesAPI;
  app: ElectronAppAPI;
  
  // Case management
  createCase: (data: Partial<Case>) => Promise<{ success: boolean; data: Case }>;
  updateCase: (caseId: string, data: Partial<Case>) => Promise<{ success: boolean }>;
  getCases: (filters?: CaseListOptions) => Promise<{ success: boolean; data: Case[] }>;
  getCase: (caseId: string) => Promise<{ success: boolean; data: Case }>;
  deleteCase: (caseId: string) => Promise<{ success: boolean }>;
  
  // Evidence
  selectFile: (options?: FileSelectOptions) => Promise<FileSelectResult>;
  processEvidence: (filePath: string) => Promise<ProcessedEvidence>;
  getEvidence: (caseId: string) => Promise<{ success: boolean; data: ProcessedEvidence[] }>;
  
  // Settings
  getSettings: () => Promise<{ success: boolean; data: Record<string, any> }>;
  updateSettings: (settings: Record<string, any>) => Promise<{ success: boolean }>;
  
  // Security
  getSecurityStats: () => Promise<{ success: boolean; data: SecurityStatsData }>;
  
  // System
  getSystemInfo: () => Promise<SystemInfo>;
  checkForUpdates: () => Promise<UpdateInfo>;
  
  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => (() => void) | undefined;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  
  // Window controls
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
