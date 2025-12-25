// lib/electron.ts
import { useState, useEffect } from 'react';
import type { Case } from '../types/schema';

// ============ TYPE DEFINITIONS ============

interface CaseListOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

interface CaseListResponse {
  success: boolean;
  cases: Case[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

interface FileSelectOptions {
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
}

interface FileSelectResult {
  canceled: boolean;
  filePaths: string[];
}

interface ReconciliationConfig {
  sourcePath: string;
  targetPath: string;
  matchFields: string[];
}

interface ReconciliationStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: {
    matched: number;
    unmatched: number;
    discrepancies: number;
  };
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

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
}

interface SecureFileMetadata {
  name?: string;
  description?: string;
  tags?: string[];
}

interface SecureFileInfo {
  id: string;
  name: string;
  size: number;
  encrypted: boolean;
  createdAt: string;
}

interface KeyInfo {
  id: string;
  type: string;
  createdAt: string;
  expiresAt?: string;
}

interface DatabaseInfo {
  encrypted: boolean;
  size: number;
  tables: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

interface BatchRequest {
  channel: string;
  data: unknown;
}

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

interface DatabaseMetrics {
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
}

interface SyncStatus {
  connected: boolean;
  lastSync: string;
  pendingOperations: number;
}

interface MonitoringDashboard {
  status: string;
  uptime: number;
  errorRate: number;
  memoryUsage: number;
}

interface OfflineOperation {
  type: string;
  entity: string;
  data: unknown;
}

// ============ ELECTRON API DECLARATION ============
// NOTE: The global Window.electronAPI type is declared in types/electron.d.ts
// These local types are for the hook and re-export

// ============ HOOK ============

export const useElectron = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  
  // isElectron can be computed directly without state
  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  useEffect(() => {
    // Only fetch system info if in Electron
    if (isElectron && window.electronAPI?.getSystemInfo) {
      window.electronAPI.getSystemInfo().then(setSystemInfo);
    }
  }, [isElectron]);

  return {
    isElectron,
    systemInfo,
    minimizeWindow: () => window.electronAPI?.minimizeWindow?.(),
    maximizeWindow: () => window.electronAPI?.maximizeWindow?.(),
    closeWindow: () => window.electronAPI?.closeWindow?.(),
  };
};

// Export types for use elsewhere
export type {
  CaseListOptions,
  CaseListResponse,
  FileSelectOptions,
  FileSelectResult,
  ReconciliationConfig,
  ReconciliationStatus,
  SystemInfo,
  UpdateInfo,
  SecureFileMetadata,
  SecureFileInfo,
  KeyInfo,
  DatabaseInfo,
  CacheStats,
  BatchRequest,
  MemoryStats,
  DatabaseMetrics,
  SyncStatus,
  MonitoringDashboard,
  OfflineOperation,
};