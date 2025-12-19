import React from 'react';
import { LayoutGrid, List, Plus, Search, Gavel } from 'lucide-react';
import { AccessibleButton } from '../../components/ui/AccessibleButton';

interface CaseHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: 'list' | 'kanban' | 'adjudication';
  onViewModeChange: (mode: 'list' | 'kanban' | 'adjudication') => void;
  onNewCase: () => void;
  caseCount: number;
}

const CaseHeader: React.FC<CaseHeaderProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onNewCase,
  caseCount
}) => {
  return (
    <div className="flex-shrink-0 p-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <List size={24} className="text-blue-600" />
          Cases
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full font-normal">{caseCount}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage and triage active fraud investigations</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search cases..."
            className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            aria-label="List View"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            aria-label="Kanban View"
          >
            <LayoutGrid size={18} />
          </button>
          <button
             onClick={() => onViewModeChange('adjudication')}
             className={`p-1.5 rounded-md transition-all ${viewMode === 'adjudication' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             aria-label="Adjudication Mode"
          >
            <Gavel size={18} />
          </button>
        </div>

        <AccessibleButton onClick={onNewCase} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          <Plus size={18} className="mr-2" /> New Case
        </AccessibleButton>
      </div>
    </div>
  );
};

export default CaseHeader;