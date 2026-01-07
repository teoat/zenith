import React from 'react';
import { User, Calendar, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { useFormatters } from '@/providers/LocaleProvider';

interface RichCaseCardProps {
  id: string;
  title: string;
  status: 'New' | 'In Review' | 'Escalated' | 'Closed';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  assignee?: { name: string; avatar?: string };
  dueDate?: string;
  tags?: string[];
  onClick?: () => void;
}

const RichCaseCard: React.FC<RichCaseCardProps> = ({
  id,
  title,
  status,
  priority,
  riskScore,
  assignee,
  dueDate,
  tags = [],
  onClick
}) => {
  const { formatDate } = useFormatters();
  const isPastDue = dueDate && new Date(dueDate) < new Date();
  
  const getPriorityColor = () => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-slate-400';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Review': return 'bg-amber-100 text-amber-800';
      case 'Escalated': return 'bg-red-100 text-red-800';
      case 'Closed': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div 
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={0}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg hover:border-blue-500/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} />
          <span className="text-xs font-mono text-slate-500">#{id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor()}`}>
            {status}
          </span>
          <button 
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-opacity"
            aria-label="More options"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>

      {/* Risk Score Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">Risk Score</span>
          <span className={`text-xs font-bold ${riskScore > 75 ? 'text-red-600' : riskScore > 50 ? 'text-amber-600' : 'text-green-600'}`}>
            {riskScore}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              riskScore > 75 ? 'bg-red-500' : riskScore > 50 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${riskScore}%` }}
            role="progressbar"
            aria-valuenow={riskScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Risk score: ${riskScore}%`}
          />
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-slate-400">+{tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {assignee ? (
            <>
              {assignee.avatar ? (
                <img src={assignee.avatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-slate-600 dark:text-slate-300">{assignee.name}</span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <User size={12} />
              Unassigned
            </div>
          )}
        </div>

        {/* Due Date */}
        {dueDate && (
          <div className={`flex items-center gap-1 text-xs ${isPastDue ? 'text-red-600' : 'text-slate-500'}`}>
            {isPastDue && <AlertTriangle size={12} />}
            <Calendar size={12} />
            <span>{formatDate(dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(RichCaseCard);
