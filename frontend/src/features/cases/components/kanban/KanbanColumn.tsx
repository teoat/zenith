import { memo } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Case, KanbanState } from "@/types/kanban";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  id: string;
  items: Case[];
  title: string;
  icon: React.ReactNode;
  focusedCard: { column: keyof KanbanState; index: number } | null;
  onCaseClick?: (caseId: string) => void;
}

export const KanbanColumn = memo(
  ({ id, items, title, icon, focusedCard, onCaseClick }: KanbanColumnProps) => {
    const focusedIndex = focusedCard?.column === id ? focusedCard.index : null;
    const isFocusedColumn = focusedCard?.column === id;

    return (
      <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="font-bold text-slate-700 dark:text-slate-300">
            {title}
          </h3>
          <span className="ml-auto bg-slate-200 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
            {items.length}
          </span>
        </div>
        <SortableContext
          id={id}
          items={items}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto min-h-[100px]">
            {items.map((item: Case, index: number) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                data={item}
                isFocused={isFocusedColumn && focusedIndex === index}
                onClick={() => onCaseClick?.(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    );
  },
);
