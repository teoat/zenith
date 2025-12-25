import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../providers/ToastProvider';
import EntityRegistry from '../components/investigation/EntityRegistry';
import { Share2, Save, RotateCcw, Network, HelpCircle, Clock, Map } from 'lucide-react';
import { api } from '../lib/api';
import InvestigationSkeleton from '../components/investigation/InvestigationSkeleton';
import ThreeDGraph from '../components/investigation/ThreeDGraph';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { secureLogger } from '../utils/secureLogger';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { useGraphData } from '../hooks/useGraphData';
import { TourGuide, Step } from '../components/onboarding/TourGuide';

const GRAPH_TUTORIAL_STEPS: Step[] = [
  { title: 'Investigation Graph', description: 'Visualize complex relationships between entities in a 3D space.' },
  { title: 'Navigation', description: 'Click and drag to rotate. Scroll to zoom. Right-click to pan.' },
  { title: 'Entity Registry', description: 'The left sidebar lists all nodes. Click one to focus on it in the graph.' },
  { title: 'Snapshots', description: 'Save the current state of your investigation using the "Save Snapshot" button.' },
  { title: 'Node Details', description: 'Click any node in the graph to view detailed properties and metadata.' }
];

const Investigation = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [showTutorial, setShowTutorial] = useState(false);

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
            <div className="flex gap-3 items-center">
               
               {/* Collaborative Avatars (Roadmap Item) */}
               <div className="flex -space-x-2 mr-2 border-r border-slate-800 pr-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 z-30" title="You">ME</div>
                    <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 z-20" title="Alice Analyst">AA</div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 z-10" title="Bob Boss">BB</div>
               </div>

                {/* Time Travel Slider (Roadmap Item) */}
                <div className="hidden xl:flex items-center gap-2 mr-2 bg-slate-800/50 p-1.5 rounded-full border border-slate-700/50">
                    <Clock size={14} className="text-slate-400 ml-1" />
                    <div className="w-24 h-1 bg-slate-700 rounded-full relative mx-1">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg cursor-pointer" />
                        <div className="h-full w-full bg-blue-500/20 rounded-full" />
                    </div>
                    <span className="text-[10px] text-blue-400 font-mono pr-1">LIVE</span>
                </div>

               <button
                  onClick={() => setShowTutorial(true)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50/10 rounded-full transition-colors mr-2"
                  aria-label="Start Tutorial"
                  title="Show Graph Tutorial"
                >
                  <HelpCircle size={20} />
                </button>

                {/* Geospatial Mode (Roadmap Item) */}
                <button
                  className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50/10 rounded-full transition-colors mr-2 hidden sm:block"
                  aria-label="Toggle Map View"
                  title="Geospatial Mode"
                >
                  <Map size={20} />
                </button>

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
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {graphData && (
             <ThreeDGraph 
               data={graphData} 
               width={window.innerWidth - 320} // Subtract sidebar width
               height={window.innerHeight - 64} // Subtract header height
             />
          )}
          {!graphData && (
            <div className="text-center text-slate-400">
              <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Graph Data</h3>
              <p className="text-sm">Could not load investigation graph.</p>
            </div>
          )}
        </div>
        
        <TourGuide 
            isOpen={showTutorial} 
            onClose={() => setShowTutorial(false)} 
            onComplete={() => setShowTutorial(false)}
            steps={GRAPH_TUTORIAL_STEPS}
        />

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
