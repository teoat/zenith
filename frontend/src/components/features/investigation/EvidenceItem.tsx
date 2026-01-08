import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { FileText, Image as ImageIcon, Video, Mail, Phone } from 'lucide-react';
import { Evidence, ItemTypes } from '@/types/investigation';
import { cn } from '@/lib/utils';

interface EvidenceItemProps {
  evidence: Evidence;
  onDrag: (evidence: Evidence) => void;
}

export const EvidenceItem: React.FC<EvidenceItemProps> = ({ evidence, onDrag }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVIDENCE,
    item: evidence,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      className={cn(
        "flex items-center gap-2 p-2 rounded border cursor-grab transition-all hover:bg-gray-50",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          console.log('Use mouse to drag');
        }
      }}
      onClick={() => onDrag(evidence)}
    >
      {getEvidenceIcon(evidence.type)}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{evidence.filename}</div>
        <div className="text-xs text-gray-500">{evidence.type}</div>
      </div>
    </div>
  );
};
