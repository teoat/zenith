import React from 'react';
import { FolderOpen } from 'lucide-react';
import type { Case } from '../../types/schema';
import type { Column } from '../ui/DataGrid';
import { DataGrid } from '../ui/DataGrid';

interface CaseTableProps {
  cases: Case[];
  onOpenCase: (id: string) => void;
  isLoading?: boolean;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'OPEN': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        case 'ADJUDICATION': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'CLOSED': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'CRITICAL': return 'text-red-600 dark:text-red-400';
        case 'HIGH': return 'text-orange-500 dark:text-orange-400';
        case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
        case 'LOW': return 'text-slate-500 dark:text-slate-400';
        default: return 'text-slate-500';
    }
};

const CaseTable: React.FC<CaseTableProps> = ({ cases, onOpenCase, isLoading }) => {
    const columns: Column<Case>[] = [
        {
          key: 'title',
          header: 'Title',
          sortable: true,
          render: (item) => (
             <button 
                onClick={() => onOpenCase(item.id)}
                className="flex items-center space-x-2 hover:text-blue-500 transition-colors text-left"
             >
                <FolderOpen size={16} className="text-slate-400" aria-hidden="true" />
                <span className="font-medium text-slate-900 dark:text-slate-200">{item.title}</span>
             </button>
          )
        },
        {
            key: 'status',
            header: 'Status',
            width: 140,
            sortable: true,
            render: (item) => (
                 <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}
                    role="status"
                  >
                    {item.status?.replace('_', ' ')}
                  </span>
            )
        },
        {
            key: 'priority',
            header: 'Priority',
            width: 120,
            sortable: true,
            render: (item) => (
                 <span className={`font-bold text-xs uppercase ${getPriorityColor(item.priority)}`}>
                     {item.priority}
                 </span>
            )
        },
        {
            key: 'riskScore',
            header: 'Risk Score',
            width: 120,
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${
                                item.riskScore > 80 ? 'bg-red-500' : 
                                item.riskScore > 50 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${item.riskScore}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-500">{item.riskScore}</span>
                </div>
            )
        },
        {
            key: 'updatedAt',
            header: 'Last Updated',
            width: 150,
            sortable: true,
            render: (item) => (
                <span className="text-xs text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <DataGrid
                data={cases}
                columns={columns}
                isLoading={isLoading}
            />
        </div>
    );
};

export default CaseTable;
