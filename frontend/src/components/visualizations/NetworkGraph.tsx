import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy load graph libraries to reduce initial bundle size
const ForceGraph2D = React.lazy(() => import('react-force-graph-2d'));
const ForceGraph3D = React.lazy(() => import('react-force-graph-3d'));

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
  height = 600,
  width,
  mode = '2d',
  onNodeClick,
  onNodeHover,
  onLinkClick
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dimensions = useResizeObserver(containerRef);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  // Use provided dimensions or observed dimensions
  const finalWidth = width || dimensions.width || 800;
  // Ensure height is respected. If container has 0 height initially, default to prop
  const finalHeight = height || dimensions.height || 600;

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    // Clone to avoid mutation by force-graph
    return {
      nodes: data.nodes.map(n => ({ ...n })),
      links: data.links.map(l => ({ ...l }))
    };
  }, [data]);

  // Keyboard navigation
  const getAdjacentNodes = useCallback((nodeId: string) => {
    if (!data) return [];
    const links = data.links.filter(l =>
      (typeof l.source === 'string' ? l.source : l.source.id) === nodeId ||
      (typeof l.target === 'string' ? l.target : l.target.id) === nodeId
    );
    const adjacentIds = new Set<string>();
    links.forEach(link => {
      if (typeof link.source === 'string' && link.source !== nodeId) adjacentIds.add(link.source);
      else if (typeof link.source === 'object' && link.source.id !== nodeId) adjacentIds.add(link.source.id);
      if (typeof link.target === 'string' && link.target !== nodeId) adjacentIds.add(link.target);
      else if (typeof link.target === 'object' && link.target.id !== nodeId) adjacentIds.add(link.target.id);
    });
    return Array.from(adjacentIds);
  }, [data]);

  const focusNextNode = useCallback(() => {
    if (!data || !focusedNodeId) return;
    const adjacent = getAdjacentNodes(focusedNodeId);
    if (adjacent.length > 0) {
      setFocusedNodeId(adjacent[0]);
    }
  }, [data, focusedNodeId, getAdjacentNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!data || !focusedNodeId) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          focusNextNode();
          break;
        case 'Tab':
          e.preventDefault();
          const currentIndex = data.nodes.findIndex(n => n.id === focusedNodeId);
          if (currentIndex >= 0) {
            const nextIndex = (currentIndex + 1) % data.nodes.length;
            setFocusedNodeId(data.nodes[nextIndex].id);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const node = data.nodes.find(n => n.id === focusedNodeId);
          if (node) onNodeClick?.(node);
          break;
        case 'Escape':
          setFocusedNodeId(null);
          break;
      }
    };

    if (data?.nodes.length) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [data, focusedNodeId, focusNextNode, onNodeClick]);

  // Initialize focus on first node if none focused
  useEffect(() => {
    if (data?.nodes.length && !focusedNodeId) {
      setFocusedNodeId(data.nodes[0].id);
    }
  }, [data, focusedNodeId]);

  if (!data || !data.nodes.length) {
    return (
      <div
        className="flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900"
        style={{ height: finalHeight, width: finalWidth }}
      >
        <p className="text-slate-500">No data to display</p>
      </div>
    );
  }

  const commonProps = {
    graphData,
    width: finalWidth,
    height: finalHeight,
    nodeLabel: "label",
    nodeAutoColorBy: "group",
    nodeVal: (node: any) => focusedNodeId === node.id ? (node.val || 5) * 1.5 : (node.val || 5),
    nodeColor: (node: any) => focusedNodeId === node.id ? '#ff6b6b' : node.color || undefined,
    linkDirectionalArrowLength: 3.5,
    linkDirectionalArrowRelPos: 1,
    onNodeClick: (node: any) => {
      setFocusedNodeId(node.id);
      onNodeClick?.(node as NetworkGraphNode);
    },
    onNodeHover: (node: any) => onNodeHover?.(node as NetworkGraphNode | null),
    onLinkClick: (link: any) => onLinkClick?.(link as NetworkGraphLink),
    backgroundColor: "rgba(0,0,0,0)" // Transparent to let container bg show
  };

  return (
    <div
      ref={containerRef}
      className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden bg-white dark:bg-slate-950 network-graph-container"
      style={{ '--container-height': `${height}px` } as React.CSSProperties}
    >
      <Suspense fallback={<Skeleton className="w-full h-full" />}>
        {mode === '3d' ? (
          <ForceGraph3D
            {...commonProps}
            nodeResolution={8}
            linkResolution={6}
            controlType="orbit"
          />
        ) : (
          <ForceGraph2D
            {...commonProps}
          />
        )}
      </Suspense>
    </div>
  );
};

export default NetworkGraph;