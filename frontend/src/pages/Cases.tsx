import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, LayoutList } from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { approvalService } from '../services/approvalService';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { CaseList } from '../components/cases/CaseList';
import CasePreviewDrawer from '../components/cases/CasePreviewDrawer';
import CaseHeader from '../components/cases/CaseHeader';
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal';
import { KEYBOARD_SHORTCUTS } from '../lib/keyboardShortcuts';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { SplitView } from '../components/ui/SplitView';
import { secureLogger } from '../utils/secureLogger';
import PageErrorBoundary from '../components/PageErrorBoundary';
import LoadingState from '../components/LoadingState';
import { useToast } from '../providers/ToastProvider';
import { Alert } from '@/components/ui/Alert';

// Lazy load heavy components
const CaseKanban = React.lazy(() => import('../components/cases/CaseKanban'));
const AdjudicationQueue = React.lazy(() => import('../pages/AdjudicationQueue'));

interface CasesProps {}

const Cases: React.FC<CasesProps> = () => {
  const { data, isLoading, error } = useCases();
  const cases = useMemo(() => data?.cases || [], [data?.cases]);
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
              <CaseList
                cases={filteredCases}
                selectedCases={selectedCases}
                previewCaseId={previewCaseId}
                onOpenCase={handleOpenCase}
                onToggleSelection={toggleCaseSelection}
                onSelectAll={selectAllCases}
                onClearSelection={clearSelection}
                onBulkAIAnalyze={handleBulkAIAnalyze}
                onBulkDelete={handleBulkDelete}
                listRef={listRef}
              />
            )}
            right={(
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
                {previewCaseId ? (
                  <CasePreviewDrawer
                    isOpen={true}
                    caseId={previewCaseId}
                    onClose={() => navigate('/cases')}
                    isEmbedded={true}
                  />
                ) : (
                  <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-16 text-center shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                         <LayoutList size={200} />
                      </div>
                      <div className="relative z-10">
                        <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mx-auto mb-6">
                           <Activity size={48} className="text-blue-500 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic">CASE ORCHESTRATOR</h3>
                        <p className="text-slate-500 text-base mt-4 max-w-sm mx-auto font-medium leading-relaxed">
                          Select an active investigation from the ledger to initiate deep-layer forensic analysis and cross-entity correlation.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Prioritized Approvals</h4>
                        <badge className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">ACTION REQUIRED</badge>
                      </div>
                      <ApprovalQueue maxHeight="450px" showHeader={false} className="border-none shadow-none bg-transparent" />
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