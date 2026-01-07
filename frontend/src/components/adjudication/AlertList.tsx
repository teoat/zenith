import React from 'react';
import type { AlertItem } from '@/lib/api';
import AlertListItem from './AlertListItem';
import { Search } from 'lucide-react';
import { VirtualizedList } from '@/components/ui/VirtualizedList';

interface AlertListProps {
  alerts: AlertItem[];
  selectedId: string | null;
  onSelect: (alert: AlertItem) => void;
  loading?: boolean;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, selectedId, onSelect, loading }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header / Filter */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Filter alerts..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
          <span>{alerts.length} Pending Review</span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">Sort by Risk</button>
        </div>
      </div>

      {/* List - Now Virtualized for Performance */}
      <div className="flex-1 overflow-hidden" role="listbox" aria-label="Alert Queue">
        {loading ? (
             <div className="p-4 text-center text-slate-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
                <p>No pending alerts.</p>
                <p className="text-xs mt-1">Great job clearing the queue!</p>
            </div>
        ) : (
            <VirtualizedList
              items={alerts}
              estimateSize={120}
              getItemKey={(alert) => alert.id}
              renderItem={(alert) => (
                <AlertListItem
                  key={alert.id}
                  alert={alert}
                  isSelected={selectedId === alert.id}
                  onSelect={onSelect}
                />
              )}
              className="h-full"
            />
        )}
      </div>
    </div>
  );
};

export default AlertList;
