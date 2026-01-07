import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Mail,
  Phone
} from 'lucide-react';
import type { Evidence } from '@/types/investigation';

interface EvidenceItemProps {
  evidence: Evidence;
  isOverlay?: boolean;
}

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

export const EvidenceItem: React.FC<EvidenceItemProps> = ({ evidence, isOverlay }) => {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `evidence-source-${evidence.id}`,
    data: { type: 'evidence', evidence }
  });

  if (isOverlay) {
    return (
      <div className="flex items-center gap-2 p-2 rounded border bg-white shadow-lg border-blue-500">
        {getEvidenceIcon(evidence.type)}
        <div className="font-medium text-sm">{evidence.filename}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 p-2 rounded border cursor-grab transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        hover:bg-gray-50 touch-none
      `}
    >
      {getEvidenceIcon(evidence.type)}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{evidence.filename}</div>
        <div className="text-xs text-gray-500">{evidence.type}</div>
      </div>
    </div>
  );
};