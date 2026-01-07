import React, { useEffect, memo } from 'react';
import { performanceMonitor } from '@/hooks/usePerformanceMonitor';

interface PerformanceDashboardProps {
  showInDevelopment?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({
  showInDevelopment = true
}) => {
  const [metrics, setMetrics] = React.useState<Record<string, any>>({});
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && showInDevelopment) {
      setIsVisible(true);
    } else if (process.env.NODE_ENV === 'production' && window.location.search.includes('perf=1')) {
      setIsVisible(true);
    }
  }, [showInDevelopment]);

  // Listen for toggle events
  useEffect(() => {
    const handleToggle = () => {
      setIsVisible(prev => !prev);
    };

    window.addEventListener('togglePerformanceDashboard', handleToggle);
    return () => window.removeEventListener('togglePerformanceDashboard', handleToggle);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      setMetrics(performanceMonitor.getAllMetrics());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const totalComponents = Object.keys(metrics).length;
  const slowComponents = Object.values(metrics).filter((m: any) => m.isSlow).length;
  const avgRenderTime = totalComponents > 0
    ? Object.values(metrics).reduce((sum: number, m: any) => sum + m.averageRenderTime, 0) / totalComponents
    : 0;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 max-w-sm z-50">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Performance Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-400">Components</div>
            <div className="font-mono">{totalComponents}</div>
          </div>
          <div>
            <div className="text-gray-400">Slow</div>
            <div className={`font-mono ${slowComponents > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {slowComponents}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-400">Avg Render Time</div>
            <div className={`font-mono ${avgRenderTime > 16 ? 'text-yellow-400' : 'text-green-400'}`}>
              {avgRenderTime.toFixed(1)}ms
            </div>
          </div>
        </div>

        {slowComponents > 0 && (
          <div className="border-t border-gray-700 pt-2">
            <div className="text-xs text-gray-400 mb-1">Slow Components:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(metrics)
                .filter(([, m]: [string, any]) => m.isSlow)
                .map(([name, m]: [string, any]) => (
                  <div key={name} className="text-xs bg-red-900/20 rounded px-2 py-1">
                    <div className="font-mono text-red-400 truncate">{name}</div>
                    <div className="text-red-300">
                      {m.slowestRenderTime.toFixed(1)}ms ({m.renderCount} renders)
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-700 pt-2 text-xs text-gray-400">
          Press Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;