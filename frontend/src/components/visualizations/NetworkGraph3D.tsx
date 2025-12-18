/**
 * Enhanced Network Graph Component
 * Uses react-force-graph-2d for WebGL-powered rendering
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { api } from '../../lib/api';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  val: number; // size
  color: string;
  risk_score: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
  value?: number; // strength/thickness
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface NetworkGraphProps {
  width?: number;
  height?: number;
  realTime?: boolean;
  onNodeClick?: (node: any) => void;
}

const NetworkGraph3D: React.FC<NetworkGraphProps> = ({
  width = 800,
  height = 600,
  realTime = false,
  onNodeClick
}) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<ForceGraphMethods>();

  // Fetch Data
  const loadGraphData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getGraphData(); // returns { entities: [], transactions: [], relationships: [] }
      setGraphData(processGraphData(data));
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const processGraphData = (rawData: any): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Entities
    rawData.entities?.forEach((e: any) => {
        nodes.push({
            id: e.id,
            name: e.name || e.id,
            type: e.type || 'entity',
            risk_score: e.risk_score || 0,
            val: Math.max(5, (e.risk_score || 0) * 10 + 5),
            color: getNodeColor(e.type, e.risk_score || 0)
        });
    });

    // Transactions
    rawData.transactions?.forEach((tx: any) => {
        // Node for transaction itself? Or link? 
        // Original code added transaction as node. Let's keep that pattern for clusters.
        if (!nodes.find(n => n.id === tx.id)) {
            nodes.push({
                id: tx.id,
                name: `$${tx.amount}`,
                type: 'transaction',
                risk_score: tx.risk_score || 0,
                val: 4,
                color: '#50E3C2'
            });
        }
        if (tx.from_entity && tx.to_entity) {
             links.push({ source: tx.from_entity, target: tx.id });
             links.push({ source: tx.id, target: tx.to_entity });
        }
    });

    // Relationships
    rawData.relationships?.forEach((r: any) => {
        links.push({ source: r.source, target: r.target, color: '#999' });
    });

    return { nodes, links };
  };

  const getNodeColor = (type: string, risk: number) => {
      if (risk > 0.7) return '#D0021B';
      if (risk > 0.4) return '#F5A623';
      switch(type) {
          case 'transaction': return '#50E3C2';
          case 'entity': return '#4A90E2';
          case 'account': return '#F5A623';
          case 'location': return '#BD10E0';
          default: return '#9B9B9B';
      }
  };

  useEffect(() => {
    loadGraphData();
    if (realTime) {
        const interval = setInterval(loadGraphData, 30000);
        return () => clearInterval(interval);
    }
  }, [loadGraphData, realTime]);

  if (loading && graphData.nodes.length === 0) {
      return <div className="flex justify-center items-center h-full">Loading Graph...</div>;
  }

  return (
    <div style={{ width, height, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
        <ForceGraph2D
            ref={fgRef}
            width={width}
            height={height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={6}
            linkColor={() => '#cccccc'}
            onNodeClick={(node) => {
                fgRef.current?.centerAt(node.x, node.y, 1000);
                fgRef.current?.zoom(4, 2000);
                onNodeClick?.(node);
            }}
            cooldownTicks={100}
        />
        <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded text-xs shadow">
            Nodes: {graphData.nodes.length} | GPU Accelerated
        </div>
    </div>
  );
};

export default NetworkGraph3D;