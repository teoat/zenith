import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Download, Move } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CanvasNode, ViewportState } from '@/types/graph';
import { GraphEdge } from '@/types/api';
import { cn } from '@/lib/utils';

interface RelationshipCanvasProps {
  nodes: CanvasNode[];
  edges: GraphEdge[];
  loading: boolean;
  selectedNodeId: string | null;
  onNodeSelect: (id: string | null) => void;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  canvasSize: { width: number; height: number };
  onExport: () => void;
}

export const RelationshipCanvas: React.FC<RelationshipCanvasProps> = ({
  nodes,
  edges,
  loading,
  selectedNodeId,
  onNodeSelect,
  viewport,
  setViewport,
  canvasSize,
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const { zoom, pan } = viewport;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw edges
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#94a3b8';
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        let color = '#64748b';
        if (node.type === 'account') color = '#3b82f6';
        if (node.type === 'merchant') color = '#10b981';
        if (selectedNodeId === node.id) color = '#f59e0b';

        ctx.beginPath();
        const radius = node.size || 10;
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = selectedNodeId === node.id ? 3 : 2;
        ctx.stroke();

        if (zoom > 0.8 || selectedNodeId === node.id) {
          ctx.fillStyle = '#1e293b';
          ctx.font = '12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.label || node.id, node.x, node.y - radius - 5);
        }
      });

      ctx.restore();
    };

    const animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, [nodes, edges, zoom, pan, selectedNodeId, canvasSize]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const clickedNode = nodes.find(node => {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return dist <= (node.size || 10) + 5;
    });

    if (clickedNode) {
      onNodeSelect(clickedNode.id);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        pan: { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
      }));
    }
  };

  const handleZoom = (factor: number) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(prev.zoom * factor, 5))
    }));
  };

  const handleReset = () => {
    setViewport({ zoom: 1, pan: { x: 0, y: 0 } });
    onNodeSelect(null);
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-lg overflow-hidden group">
      <div className="absolute top-4 right-4 flex gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 z-20">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleZoom(1.2)} aria-label="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleZoom(1/1.2)} aria-label="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleReset} aria-label="Reset View">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onExport} aria-label="Export JSON">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block touch-none cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      />

      <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-slate-500 pointer-events-none flex items-center gap-2">
        <Move className="w-3 h-3" />
        <span>Pan & Zoom</span>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center z-10">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};
