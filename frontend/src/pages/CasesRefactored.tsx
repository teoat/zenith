import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckSquare, Square, Activity, LayoutList } from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { approvalService } from '../services/approvalService';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useTouchGestures } from '../hooks/useTouchGestures';
import CasePreviewDrawer from '../components/cases/CasePreviewDrawer';
import CaseHeader from '../components/cases/CaseHeader';
import CaseActions from '../components/cases/CaseActions';
import { VirtualizedList } from '../components/ui/VirtualizedList';
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal';
import { KEYBOARD_SHORTCUTS } from '../lib/keyboardShortcuts';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { SplitView } from '../components/ui/SplitView';
import { secureLogger } from '../utils/secureLogger';
import PageErrorBoundary from '../components/PageErrorBoundary';
import LoadingState from '../components/LoadingState';
import { useToast } from '../providers/ToastProvider';

// Lazy load heavy components
const CaseKanban = React.lazy(() => import('../components/cases/CaseKanban'));
const AdjudicationQueue = React.lazy(() => import('../pages/AdjudicationQueue'));

interface CasesProps {}

const Cases: React.FC<CasesProps> = () => {
  const { data, isLoading, error } = useCases();
  const cases = data?.cases || [];
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'adjudication'>('list');

  // Computed values
  const previewCaseId = caseId || null;

  const filteredCases = useMemo(() =>
    cases.filter(caseItem =>
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [cases, searchTerm]
  );

  // Event handlers
  const handleOpenCase = useCallback((id: string) => {
    navigate(`/cases/${id}`);
  }, [navigate]);

  const handleNewCase = useCallback(() => {
    navigate('/cases/new');
  }, [navigate]);

  const toggleCaseSelection = useCallback((id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setSelectedCases(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const selectAllCases = useCallback(() => {
    setSelectedCases(new Set(filteredCases.map(c => c.id)));
  }, [filteredCases]);

  const clearSelection = useCallback(() => {
    setSelectedCases(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedCases);
    const selectedCaseTitles = cases
      .filter(c => selectedCases.has(c.id))
      .map(c => c.title)
      .join(', ');

    try {
      await approvalService.createFromAISuggestion({
        type: 'delete',
        title: `Bulk Delete ${selectedIds.length} Cases`,
        description: `Delete the following cases: ${selectedCaseTitles}`,
        details: {
          caseIds: selectedIds,
          operation: 'bulk_delete'
        },
        reasoning: 'Bulk delete operation initiated by user',
        confidence: 1.0
      });

      setSelectedCases(new Set());
      addToast('Bulk delete request submitted', 'success');
    } catch (error) {
      secureLogger.error('Failed to add bulk delete to approval queue:', error);
      addToast('Failed to submit bulk delete request', 'error');
    }
  }, [selectedCases, cases, addToast]);

  const handleBulkAIAnalyze = useCallback(async () => {
    const selectedIds = Array.from(selectedCases);
    try {
      await approvalService.createFromAISuggestion({
        type: 'external_api',
        title: `AI Deep Analysis: ${selectedIds.length} Cases`,
        description: `Run comprehensive cross-case correlation and fraud pattern detection on ${selectedIds.length} investigations.`,
        details: {
          caseIds: selectedIds,
          operation: 'bulk_ai_analyze'
        },
        reasoning: 'AI-driven batch triage requested for selected cases',
        confidence: 0.95
      });
      setSelectedCases(new Set());
      addToast('AI analysis request submitted', 'success');
    } catch (error) {
      secureLogger.error('Failed to add bulk AI analysis to approval queue:', error);
      addToast('Failed to submit AI analysis request', 'error');
    }
  }, [selectedCases, addToast]);

  // Touch gestures
  const touchRef = useTouchGestures({
    onSwipeLeft: useCallback(() => {
      const currentIndex = filteredCases.findIndex(c => c.id === previewCaseId);
      if (currentIndex >= 0 && currentIndex < filteredCases.length - 1) {
        handleOpenCase(filteredCases[currentIndex + 1].id);
      }
    }, [filteredCases, previewCaseId, handleOpenCase]),

    onSwipeRight: useCallback(() => {
      const currentIndex = filteredCases.findIndex(c => c.id === previewCaseId);
      if (currentIndex > 0) {
        handleOpenCase(filteredCases[currentIndex - 1].id);
      }
    }, [filteredCases, previewCaseId, handleOpenCase])
  });

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation for case list
  const listRef = useKeyboardNavigation({
    onArrowDown: useCallback(() => {
      const currentIndex = filteredCases.findIndex(c => c.id === previewCaseId);
      if (currentIndex < filteredCases.length - 1) {
        handleOpenCase(filteredCases[currentIndex + 1].id);
      }
    }, [filteredCases, previewCaseId, handleOpenCase]),

    onArrowUp: useCallback(() => {
      const currentIndex = filteredCases.findIndex(c => c.id === previewCaseId);
      if (currentIndex > 0) {
        handleOpenCase(filteredCases[currentIndex - 1].id);
      }
    }, [filteredCases, previewCaseId, handleOpenCase]),

    enabled: viewMode === 'list' && !!previewCaseId
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="flex-shrink-0 p-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutList size={24} className="text-blue-600" />
              Cases
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage and triage active fraud investigations</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingState type="spinner" context="data" size="lg" text="Loading cases..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="flex-shrink-0 p-6 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutList size={24} className="text-red-500" />
              Cases
            </h1>
            <p className="text-slate-500 text-sm mt-1">Failed to load cases</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-red-500 mb-4">Error loading cases: {error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header section */}
      <CaseHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewCase={handleNewCase}
        caseCount={cases.length}
      />

      {/* Content Area */}
      <div ref={touchRef} className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (
          <SplitView
            initialSplit={33}
            minLeftWidth={300}
            minRightWidth={400}
            left={(
              <div
                ref={listRef}
                className="h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                tabIndex={0}
                role="listbox"
                aria-label="Cases list"
              >
                <CaseActions
                  selectedCases={selectedCases}
                  filteredCases={filteredCases}
                  onSelectAll={selectAllCases}
                  onClearSelection={clearSelection}
                  onBulkAIAnalyze={handleBulkAIAnalyze}
                  onBulkDelete={handleBulkDelete}
                />

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
                        role="option"
                        aria-selected={previewCaseId === caseItem.id ? "true" : "false"}
                        aria-label={`Case: ${caseItem.title}`}
                      >
                        {/* Selection Checkbox */}
                        <div
                          className="mr-3 shrink-0"
                          onClick={(e) => toggleCaseSelection(caseItem.id, e)}
                          role="checkbox"
                          aria-checked={isSelected ? "true" : "false"}
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
            )}
            right={(
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                {previewCaseId ? (
                  <CasePreviewDrawer
                    isOpen={true}
                    caseId={previewCaseId}
                    onClose={() => navigate('/cases')}
                    isEmbedded={true}
                  />
                ) : (
                  <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                      <Activity size={48} className="mx-auto text-blue-500 mb-6 opacity-80" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Case Triage</h3>
                      <p className="text-slate-500 text-sm mt-3 max-w-xs mx-auto">
                        Select a case from the list to begin deep investigation, or use bulk actions to process multiple alerts at once.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Approval Workflow</h4>
                      <ApprovalQueue maxHeight="400px" showHeader={false} className="border-none shadow-none bg-transparent" />
                    </div>
                  </div>
                )}
              </div>
            )}
          />
        ) : viewMode === 'kanban' ? (
          <React.Suspense fallback={<LoadingState type="skeleton" context="component" size="lg" />}>
            <CaseKanban
              cases={filteredCases}
              onCaseClick={(id) => navigate(`/cases/${id}`)}
            />
          </React.Suspense>
        ) : (
          <React.Suspense fallback={<LoadingState type="skeleton" context="component" size="lg" />}>
            <AdjudicationQueue />
          </React.Suspense>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        shortcuts={KEYBOARD_SHORTCUTS}
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

const CasesWithErrorBoundary = () => (
  <PageErrorBoundary>
    <Cases />
  </PageErrorBoundary>
);

export default CasesWithErrorBoundary;