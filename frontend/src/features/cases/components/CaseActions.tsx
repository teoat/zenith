import React from "react";
import { CheckSquare, Square } from "lucide-react";
import { AccessibleButton } from "@/components/ui/AccessibleButton";
import type { Case } from "@/types/schema";

interface CaseActionsProps {
  selectedCases: Set<string>;
  filteredCases: Case[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAIAnalyze: () => void;
  onBulkDelete: () => void;
}

const CaseActions: React.FC<CaseActionsProps> = ({
  selectedCases,
  filteredCases,
  onSelectAll,
  onClearSelection,
  onBulkAIAnalyze,
  onBulkDelete,
}) => {
  return (
    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center">
      <button
        onClick={
          selectedCases.size === filteredCases.length &&
          filteredCases.length > 0
            ? onClearSelection
            : onSelectAll
        }
        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {selectedCases.size === filteredCases.length &&
        filteredCases.length > 0 ? (
          <CheckSquare size={14} className="text-blue-500" />
        ) : (
          <Square size={14} />
        )}
        {selectedCases.size === filteredCases.length && filteredCases.length > 0
          ? "Deselect All"
          : "Select All"}
      </button>
      {selectedCases.size > 0 && (
        <>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-4">
            {selectedCases.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            <AccessibleButton
              onClick={onBulkAIAnalyze}
              variant="secondary"
              size="sm"
              className="text-xs border-blue-500 text-blue-600 dark:border-blue-700 dark:text-blue-400"
            >
              AI Triage
            </AccessibleButton>
            <AccessibleButton
              onClick={onBulkDelete}
              variant="danger"
              size="sm"
              className="text-xs"
              aria-label={`Delete ${selectedCases.size} selected cases`}
            >
              Delete Selected
            </AccessibleButton>
          </div>
        </>
      )}
    </div>
  );
};

export default CaseActions;
