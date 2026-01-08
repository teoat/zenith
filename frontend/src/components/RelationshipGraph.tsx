// frontend/src/components/RelationshipGraph.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { api } from '../lib/api';
import { useToast } from '../providers/ToastProvider';
import { GraphNode, GraphEdge, CentralEntity, SuspiciousPattern } from '../types/api';
import { CanvasNode, GraphStats, ViewportState } from '../types/graph';
import { GraphHeader } from './features/graph/GraphHeader';
import { RelationshipCanvas } from './features/graph/RelationshipCanvas';
import { GraphStatsFooter } from './features/graph/GraphStatsFooter';
import { GraphSidebar } from './features/graph/GraphSidebar';

const RelationshipGraph: React.FC = () => {
  const { addToast } = useToast();
  const [graphData, setGraphData] = useState<{ nodes: CanvasNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<GraphStats>({});
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [centralEntities, setCentralEntities] = useState<CentralEntity[]>([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<SuspiciousPattern[]>([]);
  
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Responsive Canvas Sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getGraphData();
      if (isMounted.current) {
        const nodes: CanvasNode[] = (data.nodes || []).map((n: GraphNode) => ({
          ...n,
          label: (n.properties?.name as string) || n.name || n.id,
          x: n.x || Math.random() * 800,
          y: n.y || Math.random() * 600,
          size: n.size || 10,
          transaction_count: n.transaction_count || 0,
          total_amount: n.total_amount || 0
        }));
        setGraphData({ nodes, edges: data.links || [] });
        setStats(data.stats || {});
      }
    } catch (err) {
      addToast('Failed to load graph data', 'error');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [addToast]);

  const buildGraph = async (daysBack = 30) => {
    setLoading(true);
    try {
      const data = await api.buildGraph(daysBack);
      if (isMounted.current) {
        const nodes: CanvasNode[] = (data.nodes || []).map((n: GraphNode) => ({
          ...n,
          label: (n.properties?.name as string) || n.name || n.id,
          x: Math.random() * canvasSize.width,
          y: Math.random() * canvasSize.height,
          size: n.size || 10
        }));
        setGraphData({ nodes, edges: data.links || [] });
        setStats(data.stats || {});
        addToast(`Graph rebuilt for past ${daysBack} days`, `success`);
      }
    } catch (err) {
      addToast('Failed to rebuild graph', 'error');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      await api.getCommunities();
      addToast('Communities detected', 'success');
    } catch (err) {
      addToast('Failed to detect communities', 'error');
    }
  };

  const fetchCentralEntities = async () => {
    try {
      const data = await api.getCentralEntities(10);
      setCentralEntities(data);
    } catch (err) {
      addToast('Failed to fetch centrality', 'error');
    }
  };

  const fetchSuspiciousPatterns = async () => {
    try {
      const data = await api.getSuspiciousPatterns();
      setSuspiciousPatterns(data);
    } catch (err) {
      addToast('Failed to fetch patterns', 'error');
    }
  };

  const exportGraph = async () => {
    try {
      const data = await api.exportGraph('json');
      const exportData = (data as any).export_data || data;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relationship-graph.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Graph exported', 'success');
    } catch (err) {
      addToast('Export failed', 'error');
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const selectedNode = useMemo(() => 
    graphData.nodes.find(n => n.id === selectedNodeId) || null,
  [graphData.nodes, selectedNodeId]);

  return (
    <div className="p-6 space-y-6">
      <GraphHeader loading={loading} onBuild={buildGraph} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-full shadow-sm border-slate-200 dark:border-slate-800">
            <CardContent className="p-0 relative" ref={containerRef}>
              <RelationshipCanvas
                nodes={graphData.nodes}
                edges={graphData.edges}
                loading={loading}
                selectedNodeId={selectedNodeId}
                onNodeSelect={setSelectedNodeId}
                viewport={viewport}
                setViewport={setViewport}
                canvasSize={canvasSize}
                onExport={exportGraph}
              />
            </CardContent>
            <GraphStatsFooter stats={stats} />
          </Card>
        </div>

        <GraphSidebar
          selectedNode={selectedNode}
          centralEntities={centralEntities}
          suspiciousPatterns={suspiciousPatterns}
          onDetectCommunities={fetchCommunities}
          onDetectCentrality={fetchCentralEntities}
          onDetectPatterns={fetchSuspiciousPatterns}
          onSelectEntity={setSelectedNodeId}
        />
      </div>
    </div>
  );
};

export default RelationshipGraph;