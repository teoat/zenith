// pages/Cases.tsx
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Plus, LayoutList, LayoutGrid, Gavel, CheckSquare, Square
} from 'lucide-react';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { useCases, useCreateCase } from '../hooks/useCases';
import { useTouchGestures } from '../hooks/useTouchGestures';
import CasePreviewDrawer from '../components/cases/CasePreviewDrawer';
import InvestigationWizard, { InvestigationData } from '../components/cases/InvestigationWizard';
import { VirtualizedList } from '../components/ui/VirtualizedList';
import { Skeleton } from '../components/ui/Skeleton';

const CaseKanban = React.lazy(() => import('../components/cases/CaseKanban'));
const AdjudicationQueue = React.lazy(() => import('../pages/AdjudicationQueue'));

const Cases = () => {
  const { data } = useCases();
  const cases = data?.cases || [];
  const createCaseMutation = useCreateCase();
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'adjudication'>('list');

  // Sync URL param to state
  const previewCaseId = caseId || null;
  const setPreviewCaseId = (id: string | null) => {
    if (id) navigate(`/cases/${id}`);
    else navigate('/cases');
  }

  // Touch gestures for case navigation
  const touchRef = useTouchGestures({
    onSwipeLeft: () => {
      // Navigate to next case
      const currentIndex = cases.findIndex(c => c.id === previewCaseId);
      if (currentIndex >= 0 && currentIndex < cases.length - 1) {
        handleOpenCase(cases[currentIndex + 1].id);
      }
    },
    onSwipeRight: () => {
      // Navigate to previous case
      const currentIndex = cases.findIndex(c => c.id === previewCaseId);
      if (currentIndex > 0) {
        handleOpenCase(cases[currentIndex - 1].id);
      }
    }
  });

  const handleNewCase = useCallback(() => setIsWizardOpen(true), [setIsWizardOpen]);
  
  const handleWizardComplete = async (data: InvestigationData) => {
    // Priority is not in wizard data, default to MEDIUM
    const caseData = {
      title: data.title,
      description: data.description, 
      type: 'FRAUD' as const,
      priority: 'MEDIUM' as const,
      status: 'OPEN' as const
    };

    try {
      await createCaseMutation.mutateAsync(caseData);
      setIsWizardOpen(false);
      // Query is automatically invalidated by the mutation hook
    } catch (e) {
      console.error('Failed to create case:', e);
    }
  };
  
  const handleOpenCase = useCallback((id: string) => {
    navigate(`/cases/${id}`);
  }, [navigate]);

  const toggleCaseSelection = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedCases);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCases(newSelected);
  };

  const selectAllCases = () => {
    const allIds = new Set(filteredCases.map(c => c.id));
    setSelectedCases(allIds);
  };

  const clearSelection = () => {
    setSelectedCases(new Set());
  };

  const filteredCases = cases.filter(caseItem =>
    caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950 flex-col">
      {/* Header Toolbar */}
      <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          Cases
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">{cases.length}</span>
        </h1>

        <div className="flex items-center gap-4">
           {/* View Toggle */}
           <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                aria-label="List View"
              >
                <LayoutList size={18} />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                aria-label="Kanban View"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('adjudication')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'adjudication' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                aria-label="Adjudication View"
              >
                <Gavel size={18} />
              </button>
           </div>

           <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="search"
              placeholder="Search cases..."
              className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <AccessibleButton onClick={handleNewCase} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
            <Plus size={18} className="mr-2" /> New Case
          </AccessibleButton>
        </div>
      </div>

      {/* Content Area */}
      <div ref={touchRef} className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (
          <div className="flex h-full">
            {/* List View Left Pane */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
              <div className="case-list-content">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center">
                  <button
                    onClick={selectedCases.size === filteredCases.length && filteredCases.length > 0 ? clearSelection : selectAllCases}
                    className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {selectedCases.size === filteredCases.length && filteredCases.length > 0 ? (
                      <CheckSquare size={14} className="text-blue-500" />
                    ) : (
                      <Square size={14} />
                    )}
                    {selectedCases.size === filteredCases.length && filteredCases.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedCases.size > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-4">
                      {selectedCases.size} selected
                    </span>
                  )}
                </div>

                <VirtualizedList
                  items={filteredCases}
                  estimateSize={120}
                  getItemKey={(caseItem) => caseItem.id}
                  renderItem={(caseItem) => {
                    const isSelected = selectedCases.has(caseItem.id);
                    return (
                      <div
                        key={caseItem.id}
                        className={`case-row flex items-center p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${previewCaseId === caseItem.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'}`}
                        onClick={() => handleOpenCase(caseItem.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenCase(caseItem.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-current={previewCaseId === caseItem.id ? 'page' : undefined}
                        aria-label={`Open case: ${caseItem.title}`}
                      >
                        {/* Selection Checkbox */}
                        <div 
                          className="mr-3 shrink-0"
                          onClick={(e) => toggleCaseSelection(caseItem.id, e)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          aria-label={`Select case ${caseItem.title}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              toggleCaseSelection(caseItem.id);
                            }
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare size={20} className="text-blue-500" />
                          ) : (
                            <Square size={20} className="text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-slate-800 dark:text-white transition-colors truncate pr-2">{caseItem.title}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
                              {caseItem.status}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              caseItem.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {caseItem.priority}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                            {caseItem.description}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Created {new Date(caseItem.createdAt).toLocaleDateString()}</span>
                            <span>Risk: {caseItem.riskScore || 0}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  emptyMessage="No cases found matching your search."
                  className="h-[calc(100%-44px)]"
                />
              </div>
            </div>

            {/* List View Right Pane (Preview) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
              {previewCaseId ? (
                <CasePreviewDrawer 
                  isOpen={true} 
                  caseId={previewCaseId} 
                  onClose={() => navigate('/cases')} 
                  isEmbedded={true} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <LayoutList size={48} className="mb-4 opacity-20" />
                  <p>Select a case to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
             <CaseKanban />
          </React.Suspense>
        ) : (
          <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
             <AdjudicationQueue />
          </React.Suspense>
        )}
      </div>

       {/* Create Case Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <InvestigationWizard 
                isOpen={isWizardOpen}
                onComplete={handleWizardComplete}
                onClose={() => setIsWizardOpen(false)}
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default Cases;