import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Download, 
  Search,
  Network,
  Users,
  AlertTriangle,
  Move
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../providers/ToastProvider';
import type { GraphNode, GraphEdge, CentralEntity, SuspiciousPattern } from '../types/api';

// Extended Node type to include canvas specific props
interface CanvasNode extends GraphNode {
  x: number;
  y: number;
  size?: number;
  color?: string;
  transaction_count?: number;
  total_amount?: number;
  label: string;
}

interface GraphStats {
  node_count?: number;
  edge_count?: number;
  connected_components?: number;
  density?: number;
}

const RelationshipGraph: React.FC = () => {
  const { addToast } = useToast();
  const [graphData, setGraphData] = useState<{ nodes: CanvasNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<GraphStats>({});
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [, setCommunities] = useState<any[]>([]);
  const [centralEntities, setCentralEntities] = useState<CentralEntity[]>([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<SuspiciousPattern[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  
  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Resize Observer for Responsive Canvas
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getGraphData();
      if (isMounted.current) {
        const nodes = (data.nodes || []).map((n: any) => ({
            ...n,
            x: n.x || Math.random() * canvasSize.width, // Initialize positions if missing
            y: n.y || Math.random() * canvasSize.height
        }));
        
        setGraphData({
          nodes,
          edges: data.links || (data as any).edges || []
        });
        setStats((data as any).stats || {});
      }
    } catch (_error) {
      addToast('Failed to load graph data', 'error');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [addToast, canvasSize.height, canvasSize.width]);

  // Build graph from transactions
  const buildGraph = async (daysBack = 30) => {
    setLoading(true);
    try {
      const data = await api.buildGraph(daysBack);
      if (isMounted.current) {
        // preserve positions if nodes already exist? 
        // For simple impl, just reset or merge. Merging is complex without ID tracking. Re-initializing.
        const nodes = (data.nodes || []).map((n: any) => ({
            ...n,
            x: Math.random() * canvasSize.width,
            y: Math.random() * canvasSize.height
        }));

        setGraphData({
          nodes,
          edges: data.links || (data as any).edges || []
        });
        setStats((data as any).stats || {});
        addToast(`Graph rebuilt successfully for past ${daysBack} days`, 'success');
      }
    } catch (_error) {
      addToast('Failed to rebuild graph', 'error');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const data = await api.getCommunities();
      if (isMounted.current) {
          setCommunities((data as any).communities || []);
          addToast('Communities detected', 'success');
      }
    } catch (_error) {
      addToast('Failed to fetch communities', 'error');
    }
  };

  const fetchCentralEntities = async () => {
    try {
      const data = await api.getCentralEntities(10);
      if (isMounted.current) {
          // API returns object with central_entities or raw array
          const entities = (data as any).central_entities || data;
          setCentralEntities(Array.isArray(entities) ? entities : []);
      }
    } catch (_error) {
      addToast('Failed to fetch central entities', 'error');
    }
  };

  const fetchSuspiciousPatterns = async () => {
    try {
      const data = await api.getSuspiciousPatterns();
      if (isMounted.current) setSuspiciousPatterns((data as any).suspicious_patterns || data);
    } catch (_error) {
      addToast('Failed to fetch suspicious patterns', 'error');
    }
  };

  // Draw graph on canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use the dynamic canvas size
    const width = canvasSize.width;
    const height = canvasSize.height;

    // Reset transform to clear properly
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    ctx.lineWidth = 1;
    graphData.edges.forEach(edge => {
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = '#94a3b8'; // slate-400
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      // Node color based on type
      let color = '#64748b'; // slate-500
      if (node.type === 'account') color = '#3b82f6'; // blue-500
      if (node.type === 'merchant') color = '#10b981'; // emerald-500
      if (selectedNodeId === node.id) color = '#f59e0b'; // amber-500

      // Draw node circle
      ctx.beginPath();
      const radius = (node.size || 10);
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = selectedNodeId === node.id ? 3 : 2;
      ctx.stroke();

      // High Performance Text Rendering
      // Only draw text if zoom level is sufficient to read it, or if it's selected
      if (zoom > 0.8 || selectedNodeId === node.id) {
          ctx.fillStyle = '#1e293b';
          ctx.font = '12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.label || node.id, node.x, node.y - radius - 5);
      }
    });

    ctx.restore();
  }, [graphData, zoom, pan, selectedNodeId, canvasSize]);

  // Canvas Interactions
  const getCanvasCoordinates = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      return { x, y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    const { x, y } = getCanvasCoordinates(e);

    // Hit Testing
    const clickedNode = graphData.nodes.find(node => {
        const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        return dist <= (node.size || 10) + 5; // +5 tolerance
    });

    if (clickedNode) {
      setSelectedNodeId(clickedNode.id);
      // Announce selection for screen readers via live region (implied via focus or separate aria-live)
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard Navigation for Accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
      const PAN_STEP = 20;
      switch(e.key) {
          case 'ArrowUp':
              setPan(prev => ({ ...prev, y: prev.y + PAN_STEP }));
              break;
          case 'ArrowDown':
              setPan(prev => ({ ...prev, y: prev.y - PAN_STEP }));
              break;
          case 'ArrowLeft':
              setPan(prev => ({ ...prev, x: prev.x + PAN_STEP }));
              break;
          case 'ArrowRight':
              setPan(prev => ({ ...prev, x: prev.x - PAN_STEP }));
              break;
          case '+':
          case '=':
              handleZoomIn();
              break;
          case '-':
              handleZoomOut();
              break;
          case 'Escape':
              setSelectedNodeId(null);
              break;
      }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  };

  const exportGraph = async (format = 'json') => {
    try {
      const data = await api.exportGraph(format);
      
      const blob = new Blob([JSON.stringify((data as any).export_data || data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relationship-graph.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Graph exported successfully', 'success');
    } catch (_error) {
      addToast('Export failed', 'error');
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Re-draw on state change
  useEffect(() => {
    window.requestAnimationFrame(drawGraph);
  }, [drawGraph]);

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Relationship Graph
            </h1>
            <p className="text-secondary-400 text-sm mt-1">
                Visualize and analyze entity connections
            </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button onClick={() => buildGraph(30)} disabled={loading} variant="default" className="whitespace-nowrap">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Build (30d)
          </Button>
          <Button onClick={() => buildGraph(90)} disabled={loading} variant="outline" className="whitespace-nowrap">
            Build (90d)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Graph Canvas */}
        <div className="lg:col-span-3">
          <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Network className="w-5 h-5 text-primary-500" />
                  Interactive Graph
                </CardTitle>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleZoomIn} aria-label="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleZoomOut} aria-label="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleReset} aria-label="Reset View">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportGraph('json')} aria-label="Export JSON">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative" ref={containerRef}>
                {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
                <div 
                    className="relative w-full h-[600px] bg-slate-50 dark:bg-slate-900 overflow-hidden cursor-move focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    tabIndex={0}
                    role="application"
                    aria-label="Interactive Relationship Graph. Use arrow keys to pan, +/- to zoom."
                    onKeyDown={handleKeyDown}
                >
                {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="block touch-none"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                  
                  {/* Keyboard Intruction Overlay (fades out?) - For now just visual hint */}
                  <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-secondary-500 pointer-events-none flex items-center gap-2">
                      <Move className="w-3 h-3" />
                      <span>Pan/Zoom ready</span>
                  </div>

                  {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity">
                      <div className="text-center">
                        <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-primary-500" />
                        <p className="font-medium text-slate-900 dark:text-white">Processing Graph Data...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Accessibility Fallback Table (Screen Reader Only) */}
                  <div className="sr-only">
                      <h3>Graph Nodes</h3>
                      <ul>
                          {graphData.nodes.map(node => (
                              <li key={node.id}>
                                  {node.label} ({node.type}) - Connections: {graphData.edges.filter(e => e.source === node.id || e.target === node.id).length}
                              </li>
                          ))}
                      </ul>
                  </div>
                </div>
            </CardContent>
            
            {/* Graph Footer Stats */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.node_count || 0}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.edge_count || 0}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Edges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.connected_components || 0}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Components</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(stats.density || 0).toFixed(3)}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Density</div>
                </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-6">
          {/* Analysis Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={fetchCommunities} className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2 text-indigo-500" />
                Detect Communities
              </Button>
              <Button onClick={fetchCentralEntities} className="w-full justify-start" variant="outline">
                <Search className="w-4 h-4 mr-2 text-blue-500" />
                Central Entities
              </Button>
              <Button onClick={fetchSuspiciousPatterns} className="w-full justify-start" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                Suspicious Patterns
              </Button>
            </CardContent>
          </Card>

          {/* Selected Node Details */}
          {selectedNodeId && (
            <Card className="animate-slideUp">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-2">
                <CardTitle className="text-lg">Selected Entity</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {(() => {
                  const node = graphData.nodes.find(n => n.id === selectedNodeId);
                  if (!node) return <p className="text-sm text-slate-500 text-center">Entity not found</p>;
                  
                  return (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Label</span>
                        <span className="font-medium truncate max-w-[150px]" title={node.label}>{node.label}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Type</span>
                        <Badge variant="secondary" className="capitalize">{node.type}</Badge>
                      </div>
                       <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Transactions</span>
                        <span className="font-mono">{node.transaction_count || 0}</span>
                      </div>
                       <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Volume</span>
                        <span className="font-mono text-green-600 dark:text-green-400">
                            ${(node.total_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Central Entities List */}
          {centralEntities.length > 0 && (
            <Card className="max-h-[300px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Central Entities</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-3">
                  {centralEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className="text-sm p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setSelectedNodeId(entity.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedNodeId(entity.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select entity ${entity.name}`}
                    >
                      <div className="flex justify-between">
                          <span className="font-medium">{entity.name}</span>
                          <span className="text-xs text-blue-500 font-mono">{entity.centrality.toFixed(3)}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {entity.connections} connections
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suspicious Patterns List */}
          {suspiciousPatterns.length > 0 && (
            <Card className="max-h-[300px] flex flex-col border-red-200 dark:border-red-900/30">
              <CardHeader className="pb-2 bg-red-50/50 dark:bg-red-900/10">
                <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-3">
                  {suspiciousPatterns.map((pattern) => (
                    <div key={pattern.id} className="text-sm border-l-2 border-red-500 pl-3 p-1">
                      <div className="font-medium text-red-700 dark:text-red-300 capitalize">
                        {pattern.patternType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                        {pattern.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipGraph;