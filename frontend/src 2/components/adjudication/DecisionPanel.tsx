import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { AccessibleButton } from '../ui/AccessibleButton';

interface DecisionPanelProps {
  onApprove: () => void;
  onReject: () => void;
  onEscalate: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const DecisionPanel: React.FC<DecisionPanelProps> = ({
  onApprove,
  onReject,
  onEscalate,
  loading = false,
  disabled = false
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg z-10">
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex-1">
          <AccessibleButton
            onClick={onReject}
            disabled={loading || disabled}
            variant="danger"
            className="w-full justify-center py-6 text-lg font-medium shadow-sm active:scale-95 transition-all"
            aria-keyshortcuts="r"
            aria-label="Reject Alert (Press 'r')"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2" />}
            Reject
          </AccessibleButton>
          <div className="text-center mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            Key: R
          </div>
        </div>

        <div className="flex-1">
          <AccessibleButton
            onClick={onEscalate}
            disabled={loading || disabled}
            variant="secondary"
            className="w-full justify-center py-6 text-lg font-medium shadow-sm active:scale-95 transition-all"
            aria-keyshortcuts="e"
            aria-label="Escalate Alert (Press 'e')"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <AlertTriangle className="mr-2" />}
            Escalate
          </AccessibleButton>
          <div className="text-center mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            Key: E
          </div>
        </div>

        <div className="flex-1">
          <AccessibleButton
            onClick={onApprove}
            disabled={loading || disabled}
            variant="success"
            className="w-full justify-center py-6 text-lg font-medium shadow-sm active:scale-95 transition-all"
            aria-keyshortcuts="a"
            aria-label="Approve Alert (Press 'a')"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
            Approve
          </AccessibleButton>
          <div className="text-center mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            Key: A
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionPanel;
