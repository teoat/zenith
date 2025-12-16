/**
 * Simple NetworkGraph Component
 */

import React from 'react';

export interface NetworkGraphNode {
  id: string;
  label: string;
  group: string;
  val?: number;
  color?: string;
  [key: string]: any;
}

export interface NetworkGraphLink {
  source: string | NetworkGraphNode;
  target: string | NetworkGraphNode;
  type?: string;
  value?: number;
  color?: string;
}

export interface NetworkGraphData {
  nodes: NetworkGraphNode[];
  links: NetworkGraphLink[];
}

interface NetworkGraphProps {
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
  height = 400,
  width,
  mode = '2d',
  onNodeClick,
  onNodeHover
}) => {
  if (!data || !data.nodes.length) {
    return (
      <div
        style={{ height, width }}
        className="flex items-center justify-center border border-gray-300 rounded"
      >
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div
      style={{ height, width }}
      className="border border-gray-300 rounded p-4"
    >
      <div className="text-sm text-gray-600 mb-2">
        Network Graph: {data.nodes.length} nodes, {data.links.length} links
      </div>
      <div className="text-xs text-gray-500">
        Mode: {mode}
      </div>
      {/* Placeholder for actual graph implementation */}
      <div className="mt-4 bg-gray-100 rounded h-64 flex items-center justify-center">
        <span className="text-gray-500">Graph visualization placeholder</span>
      </div>
    </div>
  );
};

export default NetworkGraph;