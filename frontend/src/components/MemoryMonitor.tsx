import React from 'react';
import { Activity, AlertTriangle, Zap } from 'lucide-react';
import { useMemoryMonitor } from '../hooks/useMemoryCleanup';

interface MemoryMonitorProps {
  className?: string;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ className = '' }) => {
  const { memoryStats, takeSnapshot, forceCleanup } = useMemoryMonitor({
    enableAlerts: true,
    alertThreshold: 75
  });

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getMemoryStatus = () => {
    if (!memoryStats) return { status: 'unknown', color: 'text-secondary-400' };

    const percentage = (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100;

    if (percentage > 90) return { status: 'critical', color: 'text-error-400' };
    if (percentage > 75) return { status: 'warning', color: 'text-warning-400' };
    return { status: 'good', color: 'text-success-400' };
  };

  const memoryStatus = getMemoryStatus();

  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium">Memory Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => takeSnapshot('manual')}
            className="text-xs px-2 py-1 bg-primary-500/20 hover:bg-primary-500/30 rounded transition-colors"
            title="Take memory snapshot"
          >
            📸
          </button>
          <button
            onClick={forceCleanup}
            className="text-xs px-2 py-1 bg-warning-500/20 hover:bg-warning-500/30 rounded transition-colors"
            title="Force cleanup"
          >
            🧹
          </button>
        </div>
      </div>

      {memoryStats ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Used:</span>
            <span className={memoryStatus.color}>
              {formatBytes(memoryStats.usedJSHeapSize)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Total:</span>
            <span className="text-secondary-400">
              {formatBytes(memoryStats.totalJSHeapSize)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Limit:</span>
            <span className="text-secondary-400">
              {formatBytes(memoryStats.jsHeapSizeLimit)}
            </span>
          </div>

          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Usage</span>
              <span className={memoryStatus.color}>
                {((memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-secondary-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  memoryStatus.status === 'critical' ? 'bg-error-500' :
                  memoryStatus.status === 'warning' ? 'bg-warning-500' :
                  'bg-success-500'
                }`}
                style={{
                  width: `${Math.min((memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100, 100)}%`
                }}
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-secondary-400 mt-2">
            <span>Active timers: {memoryStats.activeTimers || 0}</span>
            <span>Components: {memoryStats.registeredComponents || 0}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-secondary-400 text-sm py-4">
          <Zap className="w-6 h-6 mx-auto mb-2 opacity-50" />
          Memory monitoring not available
        </div>
      )}

      {memoryStatus.status === 'critical' && (
        <div className="mt-3 p-2 bg-error-500/10 border border-error-500/20 rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-error-400" />
          <span className="text-xs text-error-400">High memory usage detected</span>
        </div>
      )}
    </div>
  );
};

export default MemoryMonitor;