/**
 * Electron utilities - Web-only stub
 * 
 * This file provides stub implementations for Electron APIs.
 * The app is now web-only; these stubs ensure graceful fallbacks.
 */

import type { ElectronAPI } from '@/types/electron';

/**
 * Check if running in Electron environment
 * @returns Always false in web-only mode
 */
export function isElectron(): boolean {
  return false;
}

/**
 * Get Electron API reference
 * @returns undefined in web-only mode
 */
export function getElectronAPI(): ElectronAPI | undefined {
  return undefined;
}

/**
 * Database query stub - not available in web mode
 */
export async function dbQuery<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
  console.warn('dbQuery is not available in web-only mode');
  return [];
}

/**
 * Database execute stub - not available in web mode
 */
export async function dbExecute(_sql: string, _params?: unknown[]): Promise<void> {
  console.warn('dbExecute is not available in web-only mode');
}
