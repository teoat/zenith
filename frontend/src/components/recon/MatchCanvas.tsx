import React, { useState, useRef } from 'react';
import { ReconciliationItem } from '../../lib/api';
import { TransactionCard } from './TransactionCard';

interface MatchCanvasProps {
  bankItems: ReconciliationItem[];
  ledgerItems: ReconciliationItem[];
  onMatch: (sourceId: string, targetId: string) => void;
  className?: string;
}

export const MatchCanvas: React.FC<MatchCanvasProps> = ({
  bankItems,
  ledgerItems,
  onMatch,
  className = '',
}) => {
  const [draggedItem, setDraggedItem] = useState<ReconciliationItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mock suggestions for demo purposes (in a real app, this would be computed or passed as prop)
  const suggestedMatches = React.useMemo(() => {
    const matches: { start: string; end: string; score: number }[] = [];
    // Simple mock logic: same amount suggestions
    bankItems.forEach(b => {
      ledgerItems.forEach(l => {
        if (Math.abs(b.amount - l.amount) < 0.01) {
          matches.push({ start: b.id, end: l.id, score: 0.95 });
        }
      });
    });
    return matches;
  }, [bankItems, ledgerItems]);

  const handleDragStart = (e: React.DragEvent, item: ReconciliationItem) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'link';
    
    // Set initial mouse pos relative to container? Hard with DragEvent. 
    // We rely on onDragOver for updates.
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'link';
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDrop = (e: React.DragEvent, targetItem: ReconciliationItem, _side: 'left' | 'right') => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== targetItem.id) {
        onMatch(draggedItem.id, targetItem.id);
    }
    setDraggedItem(null);
  };
  
  const [nodePositions, setNodePositions] = useState<Record<string, {x:number, y:number}>>({});

  // Helper to update node positions
  const updateNodePositions = () => {
    if (!containerRef.current) return;
    const positions: Record<string, {x:number, y:number}> = {};
    const containerRect = containerRef.current.getBoundingClientRect();
    
    [...bankItems, ...ledgerItems].forEach(item => {
        const el = containerRef.current?.querySelector(`#node-${item.id}`);
        if (el) {
            const elRect = el.getBoundingClientRect();
            positions[item.id] = {
                x: elRect.left - containerRect.left + (elRect.width / 2),
                y: elRect.top - containerRect.top + (elRect.height / 2)
            };
        }
    });
    setNodePositions(positions);
  };

  React.useLayoutEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateNodePositions, 0);
    window.addEventListener('resize', updateNodePositions);
    return () => {
        window.removeEventListener('resize', updateNodePositions);
        clearTimeout(timer);
    };
  }, [bankItems, ledgerItems]);

  return (
    <div 
      className={`relative flex gap-8 h-[600px] ${className}`} 
      ref={containerRef}
      onDragOver={handleDragOver}
    >
      
      {/* SVG Layer for connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
             <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Draw Suggested Matches */}
          {suggestedMatches.map((match, idx) => {
             const startPos = nodePositions[match.start];
             const endPos = nodePositions[match.end];
             
             if (!startPos || !endPos) return null;
             
             return (
               <g key={`match-${idx}`}>
                 <path 
                   d={`M ${startPos.x} ${startPos.y} C ${startPos.x + 50} ${startPos.y}, ${endPos.x - 50} ${endPos.y}, ${endPos.x} ${endPos.y}`}
                   fill="none"
                   stroke="#fbbf24" // Yellow/Amber for suggestion
                   strokeWidth="2"
                   strokeDasharray="5,5"
                   className="opacity-50"
                 />
                 <circle cx={(startPos.x + endPos.x)/2} cy={(startPos.y + endPos.y)/2} r="10" fill="#fbbf24" className="opacity-80" />
                 <text x={(startPos.x + endPos.x)/2} y={(startPos.y + endPos.y)/2} dy="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                   ?
                 </text>
               </g>
             );
          })}

          {/* Draw Active Drag Line */}
          {draggedItem && (
            (() => {
              const startPos = nodePositions[draggedItem.id];
              if (!startPos) return null;
              
              return (
                <path 
                  d={`M ${startPos.x} ${startPos.y} C ${(startPos.x + mousePos.x)/2} ${startPos.y}, ${(startPos.x + mousePos.x)/2} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                  fill="none"
                  stroke="#3b82f6" 
                  strokeWidth="3"
                  markerEnd="url(#arrowhead-active)"
                  className="animate-pulse"
                />
              );
            })()
          )}
      </svg>

      {/* Left Column: Bank Feed */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <h3 className="font-semibold text-slate-500 mb-2 uppercase text-xs tracking-wider sticky top-0 bg-slate-50 dark:bg-slate-900 py-2 z-10 backdrop-blur-sm bg-opacity-90">
            Bank Feed
        </h3>
        {bankItems.length === 0 && <div className="text-slate-400 text-sm text-center italic py-10">No unmatched items</div>}
        {bankItems.map(item => (
          <TransactionCard
            key={item.id}
            item={item}
            side="left"
            draggable={item.status !== 'matched'}
            onDragStart={handleDragStart}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e, item, 'left')} 
          />
        ))}
      </div>

      {/* Center: Match Protocol / Action Zone (Visual spacer) */}
      <div className="w-16 flex flex-col items-center justify-center gap-4 text-slate-300">
         <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Right Column: Internal Ledger */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <h3 className="font-semibold text-slate-500 mb-2 uppercase text-xs tracking-wider sticky top-0 bg-slate-50 dark:bg-slate-900 py-2 z-10 backdrop-blur-sm bg-opacity-90">
            Internal Ledger
        </h3>
        {ledgerItems.length === 0 && <div className="text-slate-400 text-sm text-center italic py-10">No unmatched items</div>}
        {ledgerItems.map(item => (
          <TransactionCard
            key={item.id}
            item={item}
            side="right"
            draggable={item.status !== 'matched'}
            onDragStart={handleDragStart}
            // For simplicity, allow dropping on either, but logic handles pairing
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e, item, 'right')}
          />
        ))}
      </div>

    </div>
  );
};
