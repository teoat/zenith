import { useParams } from 'react-router-dom';
import { useToast } from '../providers/ToastProvider';
import EntityRegistry from '../components/investigation/EntityRegistry';
import { Share2, Save, RotateCcw, Network } from 'lucide-react';
import { api } from '../lib/api';
import InvestigationSkeleton from '../components/investigation/InvestigationSkeleton';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { secureLogger } from '../utils/secureLogger';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { useGraphData } from '../hooks/useGraphData';

const Investigation = () => {
  const { caseId } = useParams<{ caseId: string }>();

  const { data: graphData, isLoading: loading, error } = useGraphData(caseId);

  const handleReset = () => {
    // Reset functionality - could invalidate React Query cache
    window.location.reload();
  };

  // Toast integration
  const { addToast } = useToast();

  const handleSaveSnapshot = async () => {
    const id = caseId || 'default';
    try {
        addToast("Saving snapshot...", "info");
        await api.saveGraphSnapshot(id, graphData);
        addToast("Snapshot saved successfully", "success");
    } catch (e) {
        secureLogger.error(e);
        addToast("Failed to save snapshot", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
        <EntityRegistry />
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          <div className="h-14 border-b border-slate-800 bg-slate-900 shadow-sm z-20">
            <div className="flex justify-between items-center px-6 h-full">
              <h1 className="font-bold text-slate-100 flex items-center gap-2">
                <Share2 size={20} className="text-blue-500" />
                Investigation #{caseId || '492'}: Shell Corp Network
              </h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <InvestigationSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500">{error.message || 'Failed to load investigation data'}</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">

      {/* Left Sidebar: Entity Registry */}
      <EntityRegistry />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">

        {/* Toolbar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900 shadow-sm z-20">
          <div className="flex justify-between items-center px-6 h-full">
            <h1 className="font-bold text-slate-100 flex items-center gap-2">
                <Share2 size={20} className="text-blue-500" />
                Investigation #{caseId || '492'}: Shell Corp Network
            </h1>
            <div className="flex gap-3">
                <AccessibleButton
                 variant="secondary"
                 onClick={handleReset}
               >
                 <RotateCcw className="w-4 h-4 mr-2" />
                 Reset
               </AccessibleButton>

               <AccessibleButton
                 variant="primary"
                 onClick={handleSaveSnapshot}
               >
                 <Save className="w-4 h-4 mr-2" />
                 Save Snapshot
               </AccessibleButton>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Investigation Graph</h3>
            <p className="text-sm">Graph visualization with {graphData?.nodes.length || 0} nodes and {graphData?.links.length || 0} connections</p>
          </div>
        </div>

      </div>

    </div>
  );
};

const InvestigationWithErrorBoundary = () => (
  <PageErrorBoundary>
    <Investigation />
  </PageErrorBoundary>
);

export default InvestigationWithErrorBoundary;
