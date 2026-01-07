import React, { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, FileText, Loader } from 'lucide-react';
import { useFormatters } from '@/providers/LocaleProvider';
import { api, type AuditLogEntry as ApiAuditLogEntry } from '@/lib/api';
import { VirtualList } from '@/components/ui/VirtualList';
import { secureLogger } from '@/utils/secureLogger';

// UI Interface extending API interface or mapping to it
interface UIAuditLogEntry extends ApiAuditLogEntry {
  level: 'info' | 'warning' | 'error';
  user: string; // Mapped from user_id
  resource: string; // Mapped from entity_type/id
  timestamp: string; // Mapped from created_at
}

const ROW_HEIGHT = 56;

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<UIAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  // const containerRef = useRef<HTMLDivElement>(null);
  const { formatTime } = useFormatters();

  useEffect(() => {
    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditLogs();
            
            // Transform API data to UI format
            const transformedLogs: UIAuditLogEntry[] = data.map(log => ({
                ...log,
                timestamp: log.created_at,
                user: log.user_id, // simple mapping for now
                resource: `${log.entity_type || 'System'} ${log.entity_id ? '#' + log.entity_id : ''}`,
                level: determineLevel(log.action),
            }));
            
            setLogs(transformedLogs);
            setError(null);
        } catch (err) {
            secureLogger.error('Failed to fetch logs:', err);
            setError('Failed to load audit trail.');
        } finally {
            setLoading(false);
        }
    };

    fetchLogs();
  }, []);

  const determineLevel = (action: string): 'info' | 'warning' | 'error' => {
      const lower = action.toLowerCase();
      if (lower.includes('error') || lower.includes('fail') || lower.includes('alert')) return 'error';
      if (lower.includes('warning') || lower.includes('update')) return 'warning';
      return 'info';
  };



  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });



  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle size={14} className="text-red-500" />;
      case 'warning': return <Shield size={14} className="text-amber-500" />;
      default: return <FileText size={14} className="text-blue-500" />;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50';
      default: return 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700';
    }
  };

  if (loading && logs.length === 0) {
      return (
          <div className="flex items-center justify-center h-[300px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500">
                  <Loader className="animate-spin" size={20} />
                  <span>Loading audit logs...</span>
              </div>
          </div>
      );
  }

  if (error) {
      return (
        <div className="flex items-center justify-center h-[300px] border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500">
            <p>{error}</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        
        <select 
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          aria-label="Filter by log level"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <VirtualList<UIAuditLogEntry>
          items={filteredLogs}
          itemHeight={ROW_HEIGHT}
          containerHeight={400} // Estimate
          getItemKey={(log: UIAuditLogEntry) => log.id}
          className="h-full"
          renderItem={(log: UIAuditLogEntry) => (
            <div 
              className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 fill-height"
              /* eslint-disable-next-line react/forbid-dom-props */
              style={{ '--height': `${ROW_HEIGHT}px` } as React.CSSProperties}
            >
              {/* Status Indicator */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${getLevelBg(log.level)}`}>
                {getLevelIcon(log.level)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-200 truncate">{log.action}</p>
                  <p className="text-xs text-slate-500 truncate">{formatTime(new Date(log.timestamp))}</p>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Shield size={12} />
                    <span className="text-sm truncate">{log.user}</span>
                  </div>
                </div>

                <div className="col-span-3">
                  <span className="text-sm text-slate-500 truncate block bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit max-w-full">
                    {log.resource}
                  </span>
                </div>

                <div className="col-span-3">
                  <p className="text-sm text-slate-500 truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 flex justify-between">
        <span>Showing {filteredLogs.length} entries</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live Updates Enabled
        </span>
      </div>
    </div>
  );
};

export default AuditLogViewer;
