import React from 'react';
import { Check, X, Info } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';
import type { DraftState } from '@/services/draftPreviewService';

interface DraftPreviewProps {
  draft: DraftState;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

export const DraftPreview: React.FC<DraftPreviewProps> = ({
  draft,
  onAccept,
  onReject,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium">
          <Info size={14} />
          <span>AI Suggestion for {draft.field}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-1">
        <div>
          <span className="text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold">Current</span>
          <div className="text-slate-500 line-through truncate">{String(draft.originalValue || 'Empty')}</div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold">Proposed</span>
          <div className="text-blue-700 dark:text-blue-300 font-medium truncate">{String(draft.value)}</div>
        </div>
      </div>

      {draft.reasoning && (
        <p className="text-xs text-amber-700 dark:text-amber-300/80 italic line-clamp-2">
          "{draft.reasoning}"
        </p>
      )}

      <div className="flex gap-2 mt-2">
        <AccessibleButton
          onClick={onAccept}
          className="flex-1 h-8 bg-amber-500 hover:bg-amber-600 border-none text-white text-xs"
        >
          <Check size={14} className="mr-1" /> Accept
        </AccessibleButton>
        <AccessibleButton
          onClick={onReject}
          variant="secondary"
          className="flex-1 h-8 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs"
        >
          <X size={14} className="mr-1" /> Ignore
        </AccessibleButton>
      </div>
    </div>
  );
};
