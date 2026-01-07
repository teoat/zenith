import React from "react";
import { Search } from "lucide-react";

interface ForensicsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
}

const ForensicsToolbar: React.FC<ForensicsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onPageChange: _onPageChange,
  currentPage,
  totalPages,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 h-12 flex items-center gap-4 shrink-0">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
        <input
          type="text"
          placeholder="Search evidence..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div className="text-sm text-slate-400">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default ForensicsToolbar;
