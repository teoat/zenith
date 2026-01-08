import React, { useRef } from 'react';
import { LayoutGrid } from 'lucide-react';
import { EvidenceCard, Connection } from '@/types/evidence';
import { EvidenceCardItem } from './EvidenceCardItem';

interface EvidenceBoardCanvasProps {
  evidence: EvidenceCard[];
  connections: Connection[];
  selectedId: string | null;
  connectingFrom: string | null;
  onSelect: (id: string) => void;
  onConnect: (id: string) => void;
}

export const EvidenceBoardCanvas: React.FC<EvidenceBoardCanvasProps> = ({
  evidence,
  connections,
  selectedId,
  connectingFrom,
  onSelect,
  onConnect
}) => {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      className="relative w-full h-[800px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden pattern-dots" 
      ref={boardRef}
    >
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
        <defs>
           <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
           </marker>
        </defs>
        {connections.map((conn, idx) => {
          const source = evidence.find(e => e.id === conn.sourceId);
          const target = evidence.find(e => e.id === conn.targetId);
          if (!source || !target) return null;

          return (
            <line
              key={idx}
              x1={source.position.x + 140}
              y1={source.position.y + 80}
              x2={target.position.x + 140}
              y2={target.position.y + 80}
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrow)"
            />
          );
        })}
      </svg>

      <div className="relative z-10 w-full h-full">
        {evidence.map(ev => (
          <EvidenceCardItem
            key={ev.id}
            evidence={ev}
            isSelected={selectedId === ev.id}
            isConnecting={connectingFrom === ev.id}
            onSelect={() => onSelect(ev.id)}
            onConnect={() => onConnect(ev.id)}
          />
        ))}

        {evidence.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
            <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-bold opacity-30">No evidence boards items found</p>
          </div>
        )}
      </div>
    </div>
  );
};
