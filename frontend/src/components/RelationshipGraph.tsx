import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ForceGraph2D from 'react-force-graph-2d';
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
  x?: number;
  y?: number;
  val?: number; // for node size
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
  const [graphData, setGraphData] = useState<{ nodes: CanvasNode[]; links: GraphEdge[] }>({ nodes: [], links: [] });
  const [stats, setStats] = useState<GraphStats>({});
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [, setCommunities] = useState<any[]>([]);
  const [centralEntities, setCentralEntities] = useState<CentralEntity[]>([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<SuspiciousPattern[]>([]);
  
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getGraphData();
      if (isMounted.current) {
        // Transform data for react-force-graph (expects 'links' not 'edges')
        const nodes = (data.nodes || []).map((n: any) => ({
            ...n,
            val: n.size || 5, // Default size
            label: n.label || n.id
        }));
        
        const links = (data.links || (data as any).edges || []).map((l: any) => ({
            ...l,
            source: l.source,
            target: l.target
        }));
        
        setGraphData({ nodes, links });
        setStats((data as any).stats || {});
      }
    } catch (_error) {
      addToast('Failed to load graph data', 'error');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [addToast]);

  // Build graph from transactions
  const buildGraph = async (daysBack = 30) => {
    setLoading(true);
    try {
      const data = await api.buildGraph(daysBack);
      if (isMounted.current) {
        const nodes = (data.nodes || []).map((n: any) => ({
            ...n,
            val: n.size || 5,
            label: n.label || n.id
        }));

        const links = (data.links || (data as any).edges || []).map((l: any) => ({
            ...l,
            source: l.source,
            target: l.target
        }));

        setGraphData({ nodes, links });
        setStats((data as any).stats || {});
        addToast(`Graph rebuilt successfully for past ${daysBack} days`, 'success');
        
        // Re-center camera
        if (fgRef.current) {
            fgRef.current.zoomToFit(400);
        }
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
          // Start physics rehear simulation to arrange communities?
          if (fgRef.current) fgRef.current.d3ReheatSimulation();
      }
    } catch (_error) {
      addToast('Failed to fetch communities', 'error');
    }
  };

  const fetchCentralEntities = async () => {
    try {
      const data = await api.getCentralEntities(10);
      if (isMounted.current) {
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

  const handleZoomIn = () => {
      if (fgRef.current) {
          fgRef.current.zoom(fgRef.current.zoom() * 1.2, 200);
      }
  };
  
  const handleZoomOut = () => {
      if (fgRef.current) {
          fgRef.current.zoom(fgRef.current.zoom() / 1.2, 200);
      }
  };

  const handleReset = () => {
      if (fgRef.current) {
          fgRef.current.zoomToFit(400);
          setSelectedNodeId(null);
      }
  };

  const handleNodeClick = useCallback((node: any) => {
      setSelectedNodeId(node.id);
      if (fgRef.current) {
          fgRef.current.centerAt(node.x, node.y, 400);
          fgRef.current.zoom(2, 2000);
      }
      
      // "Search Around" / Expansion logic could go here
      // api.getNeighbors(node.id).then(newNodes => ...)
  }, []);

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

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Relationship Graph
            </h1>
            <p className="text-secondary-400 text-sm mt-1">
                Visualize and analyze entity connections (Force Directed)
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
                <div 
                    className="relative w-full h-[600px] bg-slate-50 dark:bg-slate-900 overflow-hidden focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    role="application"
                    aria-label="Interactive Relationship Graph."
                >
                  <ForceGraph2D
                    ref={fgRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor={(node: any) => {
                        if (node.id === selectedNodeId) return '#f59e0b'; // amber-500
                        if (node.type === 'account') return '#3b82f6'; // blue-500
                        if (node.type === 'merchant') return '#10b981'; // emerald-500
                        return '#64748b'; // slate-500
                    }}
                    linkColor={() => '#94a3b8'} // slate-400
                    onNodeClick={handleNodeClick}
                    enableNodeDrag={true}
                    cooldownTicks={100}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={() => 0.005}
                  />
                  
                  {/* Keyboard Intruction Overlay */}
                  <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-secondary-500 pointer-events-none flex items-center gap-2">
                      <Move className="w-3 h-3" />
                      <span>Scroll to Zoom, Drag to Pan</span>
                  </div>

                  {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity">
                      <div className="text-center">
                        <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-primary-500" />
                        <p className="font-medium text-slate-900 dark:text-white">Processing Physics Engine...</p>
                      </div>
                    </div>
                  )}
                </div>
            </CardContent>
            
            {/* Graph Footer Stats */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.node_count || graphData.nodes.length || 0}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.edge_count || graphData.links.length || 0}</div>
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
                      onClick={() => handleNodeClick({ id: entity.id, x: 0, y: 0 })} // Simplified click handler
                      tabIndex={0}
                      role="button"
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