import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock } from "lucide-react";
import { useFormatters } from "@/providers/LocaleProvider";
import { Case } from "@/types/kanban";

interface KanbanCardProps {
  id: string;
  data: Case;
  isFocused?: boolean;
  onClick?: () => void;
}

const getRiskBarColor = (score: number) => {
  if (score >= 80) return "bg-red-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-green-500";
};

export const KanbanCard = memo(
  ({ id, data, isFocused, onClick }: KanbanCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
    const { formatDate } = useFormatters();

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = data.dueDate && new Date(data.dueDate) < new Date();

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        className={`bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-all ${isFocused ? "ring-2 ring-blue-500 shadow-md ring-offset-2 z-10 scale-[1.02]" : ""} ${data.priority === "High" ? "border-l-4 border-l-red-500" : ""}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-slate-500">#{id}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
              data.priority === "High"
                ? "bg-red-100 text-red-700"
                : data.priority === "Medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {data.priority}
          </span>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-sm mb-2 line-clamp-2">
          {data.title}
        </h4>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Risk Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Risk Score</span>
            <span className="font-mono font-bold">{data.riskScore}</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getRiskBarColor(data.riskScore)} transition-all`}
              style={{ width: `${data.riskScore}%` }}
            />
          </div>
        </div>

        {/* Footer: Assignee + Due Date */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
          {data.assignee && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                {data.assignee.avatar || data.assignee.name[0]}
              </div>
              <span className="text-slate-500">{data.assignee.name}</span>
            </div>
          )}
          {data.dueDate && (
            <span
              className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : "text-slate-400"}`}
            >
              <Clock size={12} />
              {formatDate(data.dueDate)}
            </span>
          )}
        </div>
      </div>
    );
  },
);
