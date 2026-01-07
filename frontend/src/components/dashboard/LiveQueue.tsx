import React, { memo } from 'react';
import { Activity, CheckCircle, Clock, AlertTriangle, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWebSocketQueue, type QueueItem } from '@/hooks/useWebSocketQueue';

const LiveQueue: React.FC = memo(() => {
  const { queue, isConnected, reconnect } = useWebSocketQueue({
    maxItems: 15,
    fallbackToSimulation: false,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'review': return <Clock size={16} className="text-blue-500" />;
      case 'alert': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'system': return <CheckCircle size={16} className="text-green-500" />;
      default: return <Activity size={16} />;
    }
  };

  const getPriorityClass = (p: string) => {
    switch (p) {
      case 'high': return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium': return 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/10';
      default: return 'border-l-4 border-l-slate-300 bg-slate-50 dark:bg-slate-800/50';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="text-blue-600 animate-pulse" size={20} />
          Live Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Wifi size={12} />
              Connected
            </span>
          ) : (
            <button
              onClick={reconnect}
              className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-amber-200 transition-colors"
              title="Click to reconnect"
            >
              <WifiOff size={12} />
              Simulated
            </button>
          )}
          <span className="text-xs text-slate-400">{queue.length} items</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Activity size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          queue.map((item: QueueItem) => (
            <div 
              key={item.id}
              className={`p-3 rounded-lg flex items-start gap-3 transition-all hover:translate-x-1 animate-fadeIn ${getPriorityClass(item.priority)}`}
            >
              <div className="mt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight truncate">
                  {item.msg}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400">{item.time}</span>
                  {item.type === 'review' && (
                    <Link 
                      to={item.caseId ? `/cases/${item.caseId}` : '/cases'} 
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Review <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

LiveQueue.displayName = 'LiveQueue';

export default LiveQueue;

