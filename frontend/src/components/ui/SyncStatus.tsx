// frontend/src/components/ui/SyncStatus.tsx
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import './SyncStatus.css';

interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  queueLength: number;
  queued: number;
  conflicts: number;
  failed: number;
  pendingManual: number;
  activeConflicts: Array<{
    id: string;
    type: string;
    severity: string;
    detectedAt: number;
    analysis: any;
  }>;
  lastSyncAttempt?: number;
  lastSyncResult?: any;
}

export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const syncStatus = await api.getSyncStatus();
      setStatus(syncStatus);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await api.forceSync();
      await loadSyncStatus(); // Refresh status after sync
    } catch (error) {
      console.error('Failed to force sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: string) => {
    try {
      await api.resolveConflict(conflictId, resolution as any);
      await loadSyncStatus(); // Refresh status after resolution
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  useEffect(() => {
    loadSyncStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="sync-status loading">
        <div className="sync-indicator">
          <div className="spinner"></div>
          <span>Loading sync status...</span>
        </div>
      </div>
    );
  }

  const hasIssues = status.conflicts > 0 || status.failed > 0 || status.pendingManual > 0;

  return (
    <div className={`sync-status ${hasIssues ? 'has-issues' : ''}`}>
      <div className="sync-header">
        <div className="sync-indicator">
          <div className={`status-dot ${status.isOnline ? 'online' : 'offline'}`}></div>
          <span>{status.isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="sync-actions">
          <button
            onClick={handleForceSync}
            disabled={syncing || !status.isOnline}
            className="sync-button"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={loadSyncStatus}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? '...' : '↻'}
          </button>
        </div>
      </div>

      <div className="sync-stats">
        <div className="stat-item">
          <span className="stat-label">Queued:</span>
          <span className="stat-value">{status.queued}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Conflicts:</span>
          <span className="stat-value conflicts">{status.conflicts}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Failed:</span>
          <span className="stat-value failed">{status.failed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending Manual:</span>
          <span className="stat-value manual">{status.pendingManual}</span>
        </div>
      </div>

      {status.activeConflicts.length > 0 && (
        <div className="conflicts-section">
          <h4>Active Conflicts</h4>
          {status.activeConflicts.map((conflict) => (
            <div key={conflict.id} className="conflict-item">
              <div className="conflict-info">
                <span className="conflict-type">{conflict.type}</span>
                <span className={`conflict-severity ${conflict.severity}`}>
                  {conflict.severity}
                </span>
              </div>
              <div className="conflict-actions">
                <button
                  onClick={() => handleResolveConflict(conflict.id, 'use-remote')}
                  className="resolve-button"
                >
                  Use Remote
                </button>
                <button
                  onClick={() => handleResolveConflict(conflict.id, 'use-local')}
                  className="resolve-button"
                >
                  Use Local
                </button>
                <button
                  onClick={() => handleResolveConflict(conflict.id, 'merge')}
                  className="resolve-button"
                >
                  Merge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {status.lastSyncResult && (
        <div className="last-sync-info">
          <small>
            Last sync: {new Date(status.lastSyncAttempt || 0).toLocaleString()}
            {status.lastSyncResult.status === 'completed' && (
              <span className="success">
                ✓ {status.lastSyncResult.results.successful} successful
              </span>
            )}
            {status.lastSyncResult.status === 'error' && (
              <span className="error">
                ✗ {status.lastSyncResult.error}
              </span>
            )}
          </small>
        </div>
      )}


    </div>
  );
}