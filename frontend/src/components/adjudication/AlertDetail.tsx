import React from 'react';
import type { AlertItem } from '../../lib/api';
import ContextTabs from './ContextTabs';
import DecisionPanel from './DecisionPanel';

interface AlertDetailProps {
  alert: AlertItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEscalate: (id: string) => void;
  loading?: boolean;
}

const AlertDetail: React.FC<AlertDetailProps> = ({ 
  alert, 
  onApprove, 
  onReject, 
  onEscalate,
  loading 
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {alert.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{alert.id}</span>
                <span>•</span>
                <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${alert.status === 'pending' ? 'bg-blue-100 text-blue-700' : ''}
                    ${alert.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                `}>
                    {alert.status.toUpperCase()}
                </span>
            </div>
            <button 
                onClick={() => window.location.href = `/evidence?caseId=${alert.caseId || ''}`}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
                View Proof →
            </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden relative">
            <ContextTabs alert={alert} />
        </div>

        {/* Sticky Footer */}
        <DecisionPanel 
            onApprove={() => onApprove(alert.id)}
            onReject={() => onReject(alert.id)}
            onEscalate={() => onEscalate(alert.id)}
            loading={loading}
            disabled={alert.status !== 'pending'}
        />
    </div>
  );
};

export default AlertDetail;
