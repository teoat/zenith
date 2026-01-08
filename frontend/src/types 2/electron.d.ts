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
  startSessionListener?: () => void;
  onSessionStatusChanged?: (callback: (status: { authenticated: boolean; expires?: number }) => void) => void;
}

interface ElectronDBAPI {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<{ success: boolean; data: T[] }>;
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
  extracted_tables?: Array<{ headers: string[]; rows: string[][] }>;
  document_type?: string;
  bank_statement_data?: {
    transactions: Array<{
      date: string;
      description: string;
      amount: number;
      balance: number;
    }>;
  };
  expense_data?: {
    items: Array<{
      date: string;
      description: string;
      amount: number;
      category: string;
    }>;
  };
}

interface SecurityStatsData {
  encryptionEnabled: boolean;
  secureStorage: boolean;
}

// Case related types
interface Case {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
}

interface CaseListOptions {
  page?: number;
  pageSize?: number;
  status?: Case['status'];
  priority?: Case['priority'];
  search?: string;
}

interface FileSelectOptions {
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

interface FileSelectResult {
  filePaths: string[];
  canceled?: boolean;
}

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  downloadURL?: string;
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
  getSettings: () => Promise<{ success: boolean; data: Record<string, unknown> }>;
  updateSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean }>;
  
  // Security
  getSecurityStats: () => Promise<{ success: boolean; data: SecurityStatsData }>;
  
  // System
  getSystemInfo: () => Promise<SystemInfo>;
  checkForUpdates: () => Promise<UpdateInfo>;
  
  // Event listeners with proper typing
  on: <K extends keyof ElectronAPIEvents>(
    channel: K, 
    callback: ElectronAPIEvents[K]
  ) => (() => void) | undefined;
  off: <K extends keyof ElectronAPIEvents>(
    channel: K, 
    callback: ElectronAPIEvents[K]
  ) => void;
  
  // Window controls
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
}

// Event types for Electron API
interface ElectronAPIEvents {
  'auth:changed': (isAuthenticated: boolean, user?: unknown) => void;
  'session:status': (status: { authenticated: boolean; expires?: number }) => void;
  'sync:progress': (progress: { completed: number; total: number }) => void;
  'notification': (notification: { title: string; body: string; type: string }) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
