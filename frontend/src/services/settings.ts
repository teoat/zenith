import { request, isElectron } from './client';
import type { AppSettings, AuditLogEntry, SecurityStats } from '../types/api';

export const settingsService = {
  getSettings: async (): Promise<AppSettings> => {
    return request('/settings');
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  getAuditLogs: async (params?: Record<string, unknown>): Promise<AuditLogEntry[]> => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request(`/audit/trail${query}`);
  },

  getSecurityStats: async (): Promise<SecurityStats> => {
    if (isElectron() && (window as any).electronAPI?.getSecurityStats) {
      return (window as any).electronAPI.getSecurityStats();
    }
    return { success: true, data: { encryptionEnabled: true, secureStorage: true } };
  }
};
