import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Case } from '@/types/schema';
import { formatDistanceToNow } from 'date-fns';

interface VirtualizedCaseTableProps {
  cases: Case[];
  height: number;
  itemHeight: number;
  onCaseClick: (caseId: string) => void;
}

interface CaseRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    cases: Case[];
    onCaseClick: (caseId: string) => void;
  };
}

const CaseRow: React.FC<CaseRowProps> = ({ index, style, data }) => {
  const { cases, onCaseClick } = data;
  const caseItem = cases[index];

  if (!caseItem) return null;

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

  return (
    <div
      style={style}
      className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
      onClick={() => onCaseClick(caseItem.id)}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0" />
          <h3 className="font-medium text-slate-900 dark:text-slate-200 truncate">
            {caseItem.title}
          </h3>
        </div>
      </div>

      {/* Status */}
      <div className="w-32 flex-shrink-0">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(caseItem.status)}`}>
          {caseItem.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Priority */}
      <div className="w-24 flex-shrink-0">
        <span className={`font-bold text-xs uppercase ${getPriorityColor(caseItem.priority)}`}>
          {caseItem.priority}
        </span>
      </div>

      {/* Risk Score */}
      <div className="w-24 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (caseItem.riskScore || 0) > 80 ? 'bg-red-500' :
                (caseItem.riskScore || 0) > 50 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${caseItem.riskScore || 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{caseItem.riskScore || 0}</span>
        </div>
      </div>

      {/* Last Updated */}
      <div className="w-32 flex-shrink-0 text-xs text-slate-500">
        {formatDistanceToNow(new Date(caseItem.updatedAt), { addSuffix: true })}
      </div>
    </div>
  );
};

export const VirtualizedCaseTable: React.FC<VirtualizedCaseTableProps> = ({
  cases,
  height,
  itemHeight,
  onCaseClick,
}) => {
  const itemData = useMemo(() => ({
    cases,
    onCaseClick,
  }), [cases, onCaseClick]);

  if (cases.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400"
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Cases Found</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Start your first investigation by creating a case.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex-1 font-semibold text-slate-900 dark:text-slate-200">Title</div>
        <div className="w-32 font-semibold text-slate-900 dark:text-slate-200">Status</div>
        <div className="w-24 font-semibold text-slate-900 dark:text-slate-200">Priority</div>
        <div className="w-24 font-semibold text-slate-900 dark:text-slate-200">Risk Score</div>
        <div className="w-32 font-semibold text-slate-900 dark:text-slate-200">Last Updated</div>
      </div>

      {/* Virtualized List */}
      <List
        height={height - 60} // Subtract header height
        itemCount={cases.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="virtualized-case-list"
      >
        {CaseRow}
      </List>
    </div>
  );
};