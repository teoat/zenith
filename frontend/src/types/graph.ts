import { GraphNode, GraphEdge } from './api';

export interface CanvasNode extends GraphNode {
  x: number;
  y: number;
  size?: number;
  color?: string;
  transaction_count?: number;
  total_amount?: number;
  label: string;
}

export interface GraphStats {
  node_count?: number;
  edge_count?: number;
  connected_components?: number;
  density?: number;
  stats?: Record<string, number>; // Allow for dynamic stats object
}

export interface ViewportState {
  zoom: number;
  pan: { x: number; y: number };
}
