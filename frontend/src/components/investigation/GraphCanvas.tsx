import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Search, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface GraphCanvasProps {
  width?: number;
  height?: number;
  data?: GraphData;
}

// Node and Link interfaces for type safety
export interface GraphNode {
  id: string;
  group: string;
  label: string;
  val: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}



// Mock Data
const INITIAL_DATA: GraphData = {
  nodes: [
    { id: 'n1', group: 'person', label: 'John Doe', val: 10 },
    { id: 'n2', group: 'company', label: 'Shell Corp LLC', val: 20 },
    { id: 'n3', group: 'account', label: 'ACC-99283', val: 5 },
    { id: 'n4', group: 'ip', label: '192.168.1.1', val: 5 },
    { id: 'n5', group: 'person', label: 'Jane Smith', val: 10 },
    { id: 'n6', group: 'company', label: 'Global Tech', val: 15 },
    { id: 'n7', group: 'location', label: 'Cayman Islands', val: 12 },
  ],
  links: [
    { source: 'n1', target: 'n2', type: 'OWNER' },
    { source: 'n2', target: 'n3', type: 'OWNS' },
    { source: 'n3', target: 'n4', type: 'ACCESSED_BY' },
    { source: 'n5', target: 'n2', type: 'DIRECTOR' },
    { source: 'n6', target: 'n3', type: 'TRANSFERRED_TO' },
    { source: 'n2', target: 'n7', type: 'REGISTERED_IN' },
  ]
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({ width, height, data }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  
  // Use data from props if available, otherwise fallback to initial data
  const graphData = data || INITIAL_DATA;

  const [highlightNodes, setHighlightNodes] = useState<Set<GraphNode>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<GraphLink>>(new Set());
  // const [_hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    // Initial Zoom to Fit only on mount or data change
    if (fgRef.current) {
      // Small delay to allow layout to settle
      setTimeout(() => {
          fgRef.current?.d3Force('charge')?.strength(-400);
          fgRef.current?.zoomToFit(400); 
      }, 500);
    }
  }, [data]);

  const handleNodeHover = (node: GraphNode | null) => {
    // setHoverNode(node || null); // Unused state
    
    // Simple highlight logic
    const newHighlightNodes = new Set<GraphNode>();
    const newHighlightLinks = new Set<GraphLink>();
    
    if (node) {
      newHighlightNodes.add(node);
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        if (sourceId === node.id || targetId === node.id) {
          newHighlightLinks.add(link);
          if (typeof link.source !== 'string') newHighlightNodes.add(link.source);
          if (typeof link.target !== 'string') newHighlightNodes.add(link.target);
        }
      });
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  };

  const getNodeColor = (node: GraphNode) => {
    if (highlightNodes.size > 0 && !highlightNodes.has(node)) return '#e2e8f0'; // Gray out non-highlighted links
    switch (node.group) {
      case 'person': return '#3b82f6'; // Blue
      case 'company': return '#f59e0b'; // Amber
      case 'account': return '#10b981'; // Emerald
      case 'ip': return '#6366f1'; // Indigo
      case 'location': return '#ef4444'; // Red
      default: return '#94a3b8';
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      
      {/* Toolbar overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow border border-slate-200 dark:border-slate-800 space-y-2">
           <button 
             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-500 transition-colors"
             onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)}
             aria-label="Zoom in"
           >
             <ZoomIn size={20} aria-hidden="true" />
           </button>
           <button 
             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-500 transition-colors"
             onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)}
             aria-label="Zoom out"
           >
             <ZoomOut size={20} aria-hidden="true" />
           </button>
           <button 
             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-500 transition-colors"
             onClick={() => fgRef.current?.zoomToFit(400)}
             aria-label="Fit to screen"
           >
             <Maximize size={20} aria-hidden="true" />
           </button>
        </div>
      </div>

       {/* Search overlay */}
       <div className="absolute top-4 right-4 z-10 w-64">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search entities..." 
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={graphData}
        nodeLabel="label"
        nodeColor={getNodeColor}
        nodeRelSize={6}
        linkColor={() => highlightLinks.size > 0 ? '#cbd5e1' : '#94a3b8'} // Simplified link color logic
        linkWidth={link => highlightLinks.has(link) ? 3 : 1}
        onNodeHover={handleNodeHover}
        backgroundColor={document.documentElement.classList.contains('dark') ? '#020617' : '#f8fafc'}
        cooldownTicks={100}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
        <h4 className="font-bold mb-2 text-slate-500 uppercase">Entity Types</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Person</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Company</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Account</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> IP Address</div>
           <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Location</div>
        </div>
      </div>
    </div>
  );
};

export default GraphCanvas;
