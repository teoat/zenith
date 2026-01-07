import React from "react";
import { CheckSquare, Square } from "lucide-react";
import { VirtualizedList } from "@/components/ui/VirtualizedList";
import { Case } from "@/types/schema";
import CaseActions from "./CaseActions";

interface CaseListProps {
  cases: Case[];
  selectedCases: Set<string>;
  previewCaseId: string | null;
  onOpenCase: (id: string) => void;
  onToggleSelection: (
    id: string,
    e?: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAIAnalyze: () => void;
  onBulkDelete: () => void;
  listRef?: React.RefObject<HTMLDivElement | null>;
}

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  selectedCases,
  previewCaseId,
  onOpenCase,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onBulkAIAnalyze,
  onBulkDelete,
  listRef,
}) => {
  return (
    <div
      ref={listRef}
      className="h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      tabIndex={0}
      role="listbox"
      aria-label="Cases list"
    >
      <CaseActions
        selectedCases={selectedCases}
        filteredCases={cases}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        onBulkAIAnalyze={onBulkAIAnalyze}
        onBulkDelete={onBulkDelete}
      />

      <VirtualizedList
        items={cases}
        estimateSize={120}
        getItemKey={(caseItem) => caseItem.id}
        renderItem={(caseItem) => {
          const isSelected = selectedCases.has(caseItem.id);
          const isPreviewing = previewCaseId === caseItem.id;

          return (
            <div
              key={caseItem.id}
              className={`case-row group flex items-center p-5 border-b border-slate-100 dark:border-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isPreviewing
                  ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 shadow-inner"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent"
              }`}
              onClick={() => onOpenCase(caseItem.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenCase(caseItem.id);
                }
              }}
              tabIndex={0}
              role="option"
              aria-selected={isPreviewing ? "true" : "false"}
              aria-label={`Case: ${caseItem.title}`}
            >
              <div
                className="mr-4 shrink-0"
                onClick={(e) => onToggleSelection(caseItem.id, e)}
                role="checkbox"
                aria-checked={isSelected ? "true" : "false"}
                tabIndex={0}
                aria-label={`Select case ${caseItem.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onToggleSelection(caseItem.id);
                  }
                }}
              >
                {isSelected ? (
                  <div className="p-1 rounded-md bg-blue-500 text-white">
                    <CheckSquare size={16} />
                  </div>
                ) : (
                  <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
                    <Square size={16} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p
                    className={`font-bold transition-colors truncate pr-2 ${isPreviewing ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}
                  >
                    {caseItem.title}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {caseItem.status}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-tighter ${
                      caseItem.priority === "HIGH"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {caseItem.priority}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-500 italic">
                    Risk {caseItem.riskScore || 0}%
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic font-medium">
                  {caseItem.description || "No description provided."}
                </p>
              </div>
            </div>
          );
        }}
        emptyMessage="No cases found matching your search criteria."
        className="h-[calc(100%-60px)]"
      />
    </div>
  );
};
