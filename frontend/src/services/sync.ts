import { secureLogger } from '../utils/secureLogger';
import { request, isElectron } from './client';

export const syncService = {
  getSyncStatus: async (): Promise<any> => {
    if (isElectron() && (window as any).electronAPI) {
       return { 
         isOnline: navigator.onLine, 
         syncInProgress: false, 
         queueLength: 0, 
         queued: 0, 
         conflicts: 0, 
         failed: 0, 
         pendingManual: 0, 
         activeConflicts: [], 
         lastSyncAttempt: Date.now(),
         lastSyncResult: { status: 'completed', results: { successful: 0 } }
       };
    }
    return request('/sync/status');
  },

  forceSync: async (): Promise<void> => {
    if (isElectron()) {
      secureLogger.info('SYNC', 'Force sync triggered in Electron mode');
      return;
    }
    return request('/sync/force', { method: 'POST' });
  },

  resolveConflict: async (conflictId: string, resolution: 'local' | 'remote'): Promise<void> => {
    return request(`/sync/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }
};
