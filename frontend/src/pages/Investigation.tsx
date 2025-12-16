import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { useToast } from '../providers/ToastProvider';
import GraphCanvas from '../components/investigation/GraphCanvas';
import EntityRegistry from '../components/investigation/EntityRegistry';
import { Share2, Save, RotateCcw } from 'lucide-react';
import { api, GraphData as ApiGraphData } from '../lib/api';
import InvestigationSkeleton from '../components/investigation/InvestigationSkeleton';
import { AccessibleButton } from '../components/ui/AccessibleButton';
// Removed GraphData import from ../lib/api to avoid conflict
import { GraphData, GraphNode } from '../components/investigation/GraphCanvas';

const DroppableCanvas = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });
  
  return (
    <div ref={setNodeRef} className="w-full h-full">
      {children}
    </div>
  );
};

const Investigation = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Force remount on reset
  const [graphVersion, setGraphVersion] = useState(0);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiData: ApiGraphData = await api.getGraphData();
      
      const mappedData: GraphData = {
        nodes: apiData.nodes.map((n) => ({
          id: n.id,
          group: n.type,
          label: n.name || n.id,
          val: (n.properties?.val as number) || 5
        })),
        links: apiData.links.map((l) => ({
          source: l.source,
          target: l.target,
          type: l.type
        }))
      };

      setGraphData(mappedData);
    } catch (err) {
      console.error("Failed to fetch graph data:", err);
      setError("Failed to load investigation data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [graphVersion, fetchGraphData]);

  const handleReset = () => {
    setGraphVersion(prev => prev + 1);
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
        console.error(e);
        addToast("Failed to save snapshot", "error");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'graph-canvas-droppable' && active.data.current) {
       const entity = active.data.current;
       
       // Check if node already exists
       if (graphData?.nodes.some(n => n.id === active.id)) {
           addToast(`${entity.label} is already in the graph.`, 'info');
           return;
       }

       // Add new node to graph
       const newNode: GraphNode = {
           id: String(active.id),
           group: entity.type || 'unknown',
           label: entity.label || String(active.id),
           val: 10,
           x: 0, // Force graph will settle position
           y: 0 
       };

       setGraphData(prev => {
           if (!prev) return undefined;
           return {
               ...prev,
               nodes: [...prev.nodes, newNode],
               // Optional: Link to a random node or central node to avoid floating
               links: prev.links
           };
       });

       addToast(`Added ${entity.label} to investigation queue`, 'success');
    }
  };

  if (loading) return <InvestigationSkeleton />;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
        
        {/* Left Sidebar: Entity Registry */}
        <EntityRegistry />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          
          {/* Toolbar */}
          <div className="h-14 border-b border-slate-800 flex justify-between items-center px-6 bg-slate-900 shadow-sm z-20">
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

          {/* Graph Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <DroppableCanvas>
                <GraphCanvas key={graphVersion} data={graphData} />
            </DroppableCanvas>
          </div>

        </div>

      </div>
    </DndContext>
  );
};

export default Investigation;
