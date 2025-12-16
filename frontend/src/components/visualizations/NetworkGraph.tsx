/**
 * Enhanced NetworkGraph with WebGL Support
 * Task 4.3: Relationship Graph Visualization
 * 
 * Upgrades the existing NetworkGraph component to use WebGL rendering
 * for smooth visualization of 1000+ nodes.
 * 
 * Features:
 * - Three.js WebGL renderer
 * - Interactive node expansion
 * - Path highlighting
 * - Force-directed layout
 * - Graph snapshot export
 * 
 * @module NetworkGraph
 * @see {@link https://github.com/vasturiano/react-force-graph}
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D from 'react-force-graph';
import { Download, Maximize2, Search, Filter } from 'lucide-react';
import { AccessibleButton } from '../ui/AccessibleButton';

export interface NetworkGraphNode {
  id: string;
  label: string;
  group: string;
  val?: number;  // Size
  color?: string;
  fx?: number;  // Fixed x position
  fy?: number;  // Fixed y position
  fz?: number;  // Fixed z position (3D only)
  [key: string]: any;
}

export interface NetworkGraphLink {
  source: string | NetworkGraphNode;
  target: string | NetworkGraphNode;
  type?: string;
  value?: number;  // Thickness
  color?: string;
}

export interface NetworkGraphData {
  nodes: NetworkGraphNode[];
  links: NetworkGraphLink[];
}

interface NetworkGraphProps {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    data?: NetworkGraphData;
    height?: number;
    width?: number;
    mode?: '2d' | '3d';
    focusNodeId?: string;
    onNodeClick?: (node: NetworkGraphNode) => void;
    onNodeHover?: (node: NetworkGraphNode | null) => void;
    onLinkClick?: (link: NetworkGraphLink) => void;
    showControls?: boolean;
    enablePhysics?: boolean;
}



const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = 500,
  width,
  mode = '3d',
  focusNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  showControls = true,
  enablePhysics = true
}) => {
  const graphRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<NetworkGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<NetworkGraphData>(data || { nodes: [], links: [] });

  // Update filtered data when search changes
  useEffect(() => {
    if (!data) return;

=======
  data?: NetworkGraphData;
  height?: number;
  width?: number;
  mode?: '2d' | '3d';
  focusNodeId?: string;
  onNodeClick?: (node: NetworkGraphNode) => void;
  onNodeHover?: (node: NetworkGraphNode | null) => void;
  onLinkClick?: (link: NetworkGraphLink) => void;
  showControls?: boolean;
  enablePhysics?: boolean;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = 600,
  width,
  mode = '2d',
  focusNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  showControls = true,
  enablePhysics = true
}) => {
  const graphRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<NetworkGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<NetworkGraphData>(data || { nodes: [], links: [] });

  // Update filtered data when search changes
  useEffect(() => {
    if (!data) return;

>>>>>>> Stashed changes
=======
  data?: NetworkGraphData;
  height?: number;
  width?: number;
  mode?: '2d' | '3d';
  focusNodeId?: string;
  onNodeClick?: (node: NetworkGraphNode) => void;
  onNodeHover?: (node: NetworkGraphNode | null) => void;
  onLinkClick?: (link: NetworkGraphLink) => void;
  showControls?: boolean;
  enablePhysics?: boolean;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = 600,
  width,
  mode = '2d',
  focusNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  showControls = true,
  enablePhysics = true
}) => {
  const graphRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<NetworkGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<NetworkGraphData>(data || { nodes: [], links: [] });

  // Update filtered data when search changes
  useEffect(() => {
    if (!data) return;

>>>>>>> Stashed changes
=======
  data?: NetworkGraphData;
  height?: number;
  width?: number;
  mode?: '2d' | '3d';
  focusNodeId?: string;
  onNodeClick?: (node: NetworkGraphNode) => void;
  onNodeHover?: (node: NetworkGraphNode | null) => void;
  onLinkClick?: (link: NetworkGraphLink) => void;
  showControls?: boolean;
  enablePhysics?: boolean;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = 600,
  width,
  mode = '2d',
  focusNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  showControls = true,
  enablePhysics = true
}) => {
  const graphRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<NetworkGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<NetworkGraphData>(data || { nodes: [], links: [] });

  // Update filtered data when search changes
  useEffect(() => {
    if (!data) return;

>>>>>>> Stashed changes
=======
  data?: NetworkGraphData;
  height?: number;
  width?: number;
  mode?: '2d' | '3d';
  focusNodeId?: string;
  onNodeClick?: (node: NetworkGraphNode) => void;
  onNodeHover?: (node: NetworkGraphNode | null) => void;
  onLinkClick?: (link: NetworkGraphLink) => void;
  showControls?: boolean;
  enablePhysics?: boolean;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = 600,
  width,
  mode = '2d',
  focusNodeId,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  showControls = true,
  enablePhysics = true
}) => {
  const graphRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<NetworkGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<NetworkGraphData>(data || { nodes: [], links: [] });

  // Update filtered data when search changes
  useEffect(() => {
    if (!data) return;

>>>>>>> Stashed changes
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matchingNodes = new Set(
      data.nodes
        .filter(node => 
          node.label?.toLowerCase().includes(query) ||
          node.id.toLowerCase().includes(query) ||
          node.group?.toLowerCase().includes(query)
        )
        .map(n => n.id)
    );

    // Include links between matching nodes
    const filteredLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return matchingNodes.has(sourceId) || matchingNodes.has(targetId);
    });

    setFilteredData({
      nodes: data.nodes.filter(n => matchingNodes.has(n.id)),
      links: filteredLinks
    });
  }, [searchQuery, data]);

  // Focus on specific node
  useEffect(() => {
    if (focusNodeId && graphRef.current && data) {
      const node = data.nodes.find(n => n.id === focusNodeId);
      if (node) {
        // Zoom to node
        if (mode === '3d') {
          graphRef.current.cameraPosition(
            { x: node.fx || 0, y: node.fy || 0, z: (node.fz || 0) + 200 },
            node,
            1000
          );
        } else {
          graphRef.current.centerAt(node.fx || 0, node.fy || 0, 1000);
          graphRef.current.zoom(2, 1000);
        }
        setSelectedNode(node);
      }
    }
  }, [focusNodeId, data, mode]);

  // Handle node click
  const handleNodeClick = useCallback((node: NetworkGraphNode) => {
    setSelectedNode(node);
    
    // Highlight connected nodes and links
    const connectedNodeIds = new Set<string>();
    const connectedLinkIds = new Set<string>();
    
    if (data) {
      data.links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (sourceId === node.id || targetId === node.id) {
          connectedNodeIds.add(sourceId);
          connectedNodeIds.add(targetId);
          connectedLinkIds.add(`${sourceId}-${targetId}`);
        }
      });
    }
    
    setHighlightNodes(connectedNodeIds);
    setHighlightLinks(connectedLinkIds);
    
    onNodeClick?.(node);
  }, [data, onNodeClick]);

  // Handle node hover
  const handleNodeHover = useCallback((node: NetworkGraphNode | null) => {
    setHoverNode(node);
    onNodeHover?.(node);
  }, [onNodeHover]);

  // Export graph snapshot
  const handleExport = useCallback(() => {
    if (!graphRef.current) return;

    try {
      // Get canvas element
      const canvas = graphRef.current?.renderer()?.domElement;
      if (canvas) {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `network-graph-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  // Reset view
  const handleReset = useCallback(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setSelectedNode(null);
    setSearchQuery('');
    if (graphRef.current) {
      if (mode === '3d') {
        graphRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 }, 1000);
      } else {
        graphRef.current.zoomToFit(1000);
      }
    }
  }, [mode]);

  // Node styling
  const getNodeColor = (node: NetworkGraphNode) => {
    if (selectedNode?.id === node.id) return '#3b82f6'; // Blue for selected
    if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) return '#94a3b8'; // Dimmed
    return node.color || '#64748b';
  };

  const getNodeSize = (node: NetworkGraphNode) => {
    const baseSize = node.val || 5;
    if (selectedNode?.id === node.id) return baseSize * 1.5;
    if (hoverNode?.id === node.id) return baseSize * 1.3;
    return baseSize;
  };

  // Link styling  
  const getLinkColor = (link: NetworkGraphLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const linkId = `${sourceId}-${targetId}`;
    
    if (highlightLinks.size > 0 && !highlightLinks.has(linkId)) return 'rgba(148, 163, 184, 0.2)';
    return link.color || 'rgba(148, 163, 184, 0.6)';
  };

  const getLinkWidth = (link: NetworkGraphLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const linkId = `${sourceId}-${targetId}`;
    
    const baseWidth = link.value || 1;
    if (highlightLinks.has(linkId)) return baseWidth * 2;
    return baseWidth;
  };

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <p className="text-lg font-medium">No graph data available</p>
          <p className="text-sm mt-2">Add entities and connections to visualize the network</p>
        </div>
      </div>
    );
  }

  const GraphComponent = mode === '3d' ? ForceGraph3D : ForceGraph2D;

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 items-center">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg text-sm shadow-lg"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <AccessibleButton
              onClick={handleReset}
              variant="secondary"
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg"
              title="Reset view"
            >
              <Maximize2 size={16} />
            </AccessibleButton>

            <AccessibleButton
              onClick={handleExport}
              variant="secondary"
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg"
              title="Export snapshot"
            >
              <Download size={16} />
            </AccessibleButton>
          </div>
        </div>
      )}

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-300 dark:border-slate-700 max-w-sm">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-slate-900 dark:text-white">{selectedNode.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-slate-700"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><span className="font-medium">ID:</span> {selectedNode.id}</p>
            <p><span className="font-medium">Type:</span> {selectedNode.group}</p>
            <p>
              <span className="font-medium">Connections:</span>{' '}
              {highlightNodes.size - 1}
            </p>
          </div>
        </div>
      )}

      {/* Graph Visualization */}
      <GraphComponent
        ref={graphRef}
        graphData={filteredData}
        height={height}
        width={width}
        nodeLabel="label"
        nodeVal={getNodeSize}
        nodeColor={getNodeColor}
        nodeAutoColorBy="group"
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={getLinkWidth}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onLinkClick={onLinkClick}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={enablePhysics ? Infinity : 0}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        {...(mode === '3d' ? {
          nodeThreeObject: undefined,
          linkThreeObjectExtend: true,
        } : {
          nodeCanvasObject: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Draw label background
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2,
              node.y - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );
            
            // Draw label text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color || '#000';
            ctx.fillText(label, node.x, node.y);
          }
        })}
      />

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs">
        <div className="text-slate-600 dark:text-slate-400 space-y-1">
          <div><span className="font-medium">Nodes:</span> {filteredData.nodes.length}</div>
          <div><span className="font-medium">Links:</span> {filteredData.links.length}</div>
          {searchQuery && <div className="text-blue-600">Filtered</div>}
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
