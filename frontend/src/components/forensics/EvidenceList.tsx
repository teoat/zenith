import React from "react";
import type { EvidenceItem } from "@/lib/api";

interface EvidenceListProps {
  evidence: EvidenceItem[];
  selectedEvidenceId: string | null;
  onEvidenceSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const EvidenceList: React.FC<EvidenceListProps> = ({
  evidence,
  selectedEvidenceId,
  onEvidenceSelect,
}) => {
  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-bold flex items-center gap-2 text-slate-100">
          Evidence Locker
        </h2>
        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
          {evidence.length} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {evidence.map((item) => (
          <button
            key={item.id}
            onClick={() => onEvidenceSelect(item.id)}
            className={`w-full flex items-center gap-3 p-3 text-left transition-all border-l-4 ${
              selectedEvidenceId === item.id
                ? "bg-blue-900/20 text-blue-200 border-blue-500"
                : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="p-2 rounded bg-slate-800">📄</div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {item.fileName}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(item.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EvidenceList;
