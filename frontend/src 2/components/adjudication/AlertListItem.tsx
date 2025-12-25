import React from 'react';
import { AlertItem } from '../../lib/api'; // Assuming type exists
import { useFormatters } from '../../providers/LocaleProvider';
import { AlertTriangle, Clock } from 'lucide-react';

interface AlertListItemProps {
  alert: AlertItem;
  isSelected?: boolean;
  onSelect: (alert: AlertItem) => void;
}

const AlertListItem: React.FC<AlertListItemProps> = ({ alert, isSelected, onSelect }) => {
  const { formatDate } = useFormatters();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(alert);
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(alert)}
      onKeyDown={handleKeyDown}
      className={`
        relative p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
        ${isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(alert.priority)}`}>
          {alert.priority.toUpperCase()}
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={12} />
          {formatDate(alert.createdAt)}
        </span>
      </div>

      <h4 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
        {alert.title}
      </h4>

      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
        {alert.description}
      </p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {alert.riskScore > 80 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle size={12} />
              {alert.riskScore}% Risk
            </span>
          )}
        </div>
        <div className="font-mono text-slate-600 dark:text-slate-300">
           {/* Placeholder for amount if available in generic type, otherwise Case ID */}
           {alert.caseId}
        </div>
      </div>
    </div>
  );
};

export default AlertListItem;
