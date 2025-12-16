/**
 * Enhanced 2D Network Graph Component
 * Interactive force-directed graph with real-time data streaming
 * Foundation for future 3D enhancement
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../../lib/api';

interface Node {
  id: string;
  name: string;
  type: 'entity' | 'transaction' | 'account' | 'location';
  risk_score: number;
  size: number;
  color: string;
  group?: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  type: 'transaction' | 'ownership' | 'location' | 'communication';
  strength: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface NetworkGraph3DProps {
  width?: number;
  height?: number;
  realTime?: boolean;
  onNodeClick?: (node: Node) => void;
}

const NetworkGraph3D: React.FC<NetworkGraph3DProps> = ({
  width = 800,
  height = 600,
  realTime = false,
  onNodeClick
}) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load initial graph data
  const loadGraphData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getGraphData();
      setGraphData(processGraphData(data));
    } catch (_error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Process raw graph data into visualization format
  const processGraphData = (rawData: any): GraphData => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Process entities
    rawData.entities?.forEach((entity: any) => {
      nodes.push({
        id: entity.id,
        name: entity.name || entity.id,
        type: entity.type || 'entity',
        risk_score: entity.risk_score || 0,
        size: Math.max(5, Math.min(20, (entity.risk_score || 0) * 10 + 5)),
        color: getNodeColor(entity.type, entity.risk_score || 0),
        group: entity.cluster_id
      });
    });

    // Process transactions
    rawData.transactions?.forEach((tx: any) => {
      // Add transaction as node if not already present
      if (!nodes.find(n => n.id === tx.id)) {
        nodes.push({
          id: tx.id,
          name: `$${tx.amount?.toLocaleString() || 'Unknown'}`,
          type: 'transaction',
          risk_score: tx.risk_score || 0,
          size: Math.max(3, Math.min(15, Math.log10(tx.amount || 1000) - 1)),
          color: getNodeColor('transaction', tx.risk_score || 0)
        });
      }

      // Add links between entities and transactions
      if (tx.from_entity && tx.to_entity) {
        links.push({
          source: tx.from_entity,
          target: tx.id,
          value: tx.amount || 0,
          type: 'transaction',
          strength: tx.risk_score || 0.1
        });
        links.push({
          source: tx.id,
          target: tx.to_entity,
          value: tx.amount || 0,
          type: 'transaction',
          strength: tx.risk_score || 0.1
        });
      }
    });

    // Process relationships
    rawData.relationships?.forEach((rel: any) => {
      links.push({
        source: rel.source,
        target: rel.target,
        value: rel.strength || 1,
        type: rel.type || 'relationship',
        strength: rel.strength || 0.5
      });
    });

    return { nodes, links };
  };

  // Get color based on node type and risk score
  const getNodeColor = (type: string, riskScore: number): string => {
    const baseColors = {
      entity: '#4A90E2',
      transaction: '#50E3C2',
      account: '#F5A623',
      location: '#D0021B'
    };

    const baseColor = baseColors[type as keyof typeof baseColors] || '#9B9B9B';

    // Adjust color intensity based on risk score
    if (riskScore > 0.7) {
      return '#D0021B'; // High risk - red
    } else if (riskScore > 0.4) {
      return '#F5A623'; // Medium risk - orange
    } else if (riskScore > 0.2) {
      return '#F5DD0E'; // Low risk - yellow
    } else {
      return baseColor; // Low risk - default color
    }
  };

  // Set up real-time updates
  useEffect(() => {
    loadGraphData();

    if (realTime) {
      const interval = setInterval(() => {
        loadGraphData();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [loadGraphData, realTime]);

  // Simple force-directed layout calculation
  const calculateLayout = useCallback((nodes: Node[], links: Link[]) => {
    // Simple force-directed algorithm implementation
    const centerX = width / 2;
    const centerY = height / 2;
    const repulsionForce = 500;
    const attractionForce = 0.01;

    // Initialize positions
    nodes.forEach((node, i) => {
      if (node.x === undefined || node.y === undefined) {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.3;
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
      }
    });

    // Apply forces for a few iterations
    for (let iteration = 0; iteration < 50; iteration++) {
      // Calculate repulsive forces between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];

          const dx = (node2.x || 0) - (node1.x || 0);
          const dy = (node2.y || 0) - (node1.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = repulsionForce / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          node1.x = (node1.x || 0) - fx * 0.1;
          node1.y = (node1.y || 0) - fy * 0.1;
          node2.x = (node2.x || 0) + fx * 0.1;
          node2.y = (node2.y || 0) + fy * 0.1;
        }
      }

      // Calculate attractive forces along links
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;

        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);

        if (sourceNode && targetNode) {
          const dx = (targetNode.x || 0) - (sourceNode.x || 0);
          const dy = (targetNode.y || 0) - (sourceNode.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = distance * attractionForce * link.strength;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          sourceNode.x = (sourceNode.x || 0) + fx * 0.1;
          sourceNode.y = (sourceNode.y || 0) + fy * 0.1;
          targetNode.x = (targetNode.x || 0) - fx * 0.1;
          targetNode.y = (targetNode.y || 0) - fy * 0.1;
        }
      });

      // Keep nodes within bounds
      nodes.forEach(node => {
        node.x = Math.max(50, Math.min(width - 50, node.x || centerX));
        node.y = Math.max(50, Math.min(height - 50, node.y || centerY));
      });
    }
  }, [width, height]);

  // Render graph on canvas
  const renderGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate layout
    calculateLayout(graphData.nodes, graphData.links);

    // Draw links
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      const sourceNode = graphData.nodes.find(n => n.id === sourceId);
      const targetNode = graphData.nodes.find(n => n.id === targetId);

      if (sourceNode && targetNode && sourceNode.x !== undefined && sourceNode.y !== undefined &&
          targetNode.x !== undefined && targetNode.y !== undefined) {

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = link.type === 'transaction' ? '#50E3C2' : '#4A90E2';
        ctx.lineWidth = Math.max(1, link.strength * 3);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    graphData.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Add border for high-risk nodes
        if (node.risk_score > 0.7) {
          ctx.strokeStyle = '#D0021B';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.substring(0, 10), node.x, node.y - node.size - 5);
      }
    });
  }, [graphData, calculateLayout, width, height]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = graphData.nodes.find(node => {
      if (node.x === undefined || node.y === undefined) return false;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      if (onNodeClick) {
        onNodeClick(clickedNode);
      }
    }
  }, [graphData.nodes, onNodeClick]);

  // Render when data changes
  useEffect(() => {
    if (!loading && graphData.nodes.length > 0) {
      renderGraph();
    }
  }, [graphData, loading, renderGraph]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="border border-gray-200 rounded cursor-pointer"
        style={{ backgroundColor: '#f8fafc' }}
      />

      {/* Node details panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
          <h3 className="font-semibold text-lg mb-2">{selectedNode.name}</h3>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Type:</span> {selectedNode.type}</div>
            <div><span className="font-medium">Risk Score:</span> {(selectedNode.risk_score * 100).toFixed(1)}%</div>
            <div><span className="font-medium">ID:</span> {selectedNode.id}</div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-3 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
        <div className="text-sm font-medium mb-2">Interactive Network Graph</div>
        <div className="text-xs space-y-1">
          <div>• Click nodes to view details</div>
          <div>• Real-time: {realTime ? 'Enabled' : 'Disabled'}</div>
          <div>• Nodes: {graphData.nodes.length}</div>
          <div>• Connections: {graphData.links.length}</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph3D;