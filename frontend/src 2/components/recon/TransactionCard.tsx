import React from 'react';
import { ReconciliationItem } from '../../lib/api';
import { useFormatters } from '../../providers/LocaleProvider';
import { GripVertical, AlertTriangle } from 'lucide-react';

interface TransactionCardProps {
  item: ReconciliationItem;
  side: 'left' | 'right'; // left = bank, right = ledger
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, item: ReconciliationItem) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
  highlighted?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  item,
  side,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  className = '',
  highlighted = false,
}) => {
  const { formatCurrency, formatDate } = useFormatters();

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, item);
      e.dataTransfer.effectAllowed = 'link';
      // Create a custom drag image if needed, or stick to default
    }
  };

  const statusColor = {
    matched: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    unmatched: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
    discrepancy: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    pending: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    reconciled: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  }[item.status] || 'border-slate-200 bg-white';

  const highlightClass = highlighted ? 'ring-2 ring-blue-500 shadow-lg z-10' : '';

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative p-3 rounded-lg border shadow-sm transition-all
        ${statusColor} ${highlightClass} ${className}
        ${draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
           {draggable && (
             <div className="text-slate-400 cursor-grab active:cursor-grabbing">
               <GripVertical size={14} />
             </div>
           )}
           <div>
             <div className="font-semibold text-slate-800 dark:text-slate-200">
               {formatCurrency(item.amount, item.currency)}
             </div>
             <div className="text-xs text-slate-500 font-mono mt-0.5">
               {formatDate(item.date)}
             </div>
           </div>
        </div>
        
        {item.status === 'discrepancy' && (
          <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
        )}
      </div>

      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate" title={item.notes || 'No description'}>
        {item.notes || 'Transaction'}
      </div>
      
      {/* Connector Node for SVG lines */}
      <div 
        id={`node-${item.id}`}
        className={`absolute top-1/2 w-2 h-2 rounded-full bg-slate-400 transform -translate-y-1/2
          ${side === 'left' ? '-right-1 translate-x-1/2' : '-left-1 -translate-x-1/2'}
        `} 
      />
    </div>
  );
};
