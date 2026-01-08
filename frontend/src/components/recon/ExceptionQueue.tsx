import React from 'react';
import { ReconciliationItem } from '../../lib/api';
import { AlertTriangle } from 'lucide-react';
import { useFormatters } from '../../providers/LocaleProvider';

interface ExceptionQueueProps {
  items: ReconciliationItem[];
  onFlag: (id: string) => void;
  className?: string;
}

export const ExceptionQueue: React.FC<ExceptionQueueProps> = ({
  items,
  onFlag,
  className = '',
}) => {
  const { formatCurrency, formatDate } = useFormatters();

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <AlertTriangle size={16} className="text-orange-500" />
        Exceptions ({items.length})
      </h3>
      
      <div className="flex flex-col gap-2">
        {items.length === 0 && (
            <div className="text-sm text-slate-400 italic">No exceptions found.</div>
        )}
        {items.map(item => (
          <div key={item.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex justify-between items-center group">
             <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.amount, item.currency)}
                </div>
                <div className="text-xs text-slate-500">
                    {item.source} • {formatDate(item.date)}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {item.notes || 'Discrepancy detected'}
                </div>
             </div>
             <button
                onClick={() => onFlag(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
             >
                Flag
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};
