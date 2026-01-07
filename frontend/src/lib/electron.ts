/**
 * Electron lib - Web-only stub
 * 
 * Provides no-op implementations for Electron window controls.
 */

import { useState } from 'react';

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  nodeVersion: string;
  electronVersion: string;
}

export interface ElectronWindow {
  isElectron: boolean;
  systemInfo: SystemInfo | null;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

export function useElectron(): ElectronWindow {
  const [systemInfo] = useState<SystemInfo | null>(null);

  return {
    isElectron: false,
    systemInfo,
    minimizeWindow: () => console.warn('minimizeWindow not available in web mode'),
    maximizeWindow: () => console.warn('maximizeWindow not available in web mode'),
    closeWindow: () => console.warn('closeWindow not available in web mode'),
  };
}

export default useElectron;