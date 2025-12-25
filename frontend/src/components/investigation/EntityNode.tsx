import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Video,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import type { Entity } from '../../types/investigation';

interface EntityNodeProps {
  entity: Entity;
  isSelected: boolean;
  onSelect: (entity: Entity) => void;
  onConnect?: (entity: Entity) => void;
  onToggleVisibility?: (entityId: string) => void;
  onDelete?: (entityId: string) => void;
  scale?: number;
  isOverlay?: boolean;
}

const renderEntityIcon = (type: string, className: string = "w-4 h-4") => {
  switch (type) {
    case 'person': return <Users className={className} />;
    case 'organization': return <Building className={className} />;
    case 'location': return <MapPin className={className} />;
    case 'document': return <FileText className={className} />;
    case 'transaction': return <DollarSign className={className} />;
    case 'image': return <ImageIcon className={className} />;
    case 'video': return <Video className={className} />;
    case 'email': return <Mail className={className} />;
    case 'phone': return <Phone className={className} />;
    default: return <Users className={className} />;
  }
};

const getEntityColor = (type: string) => {
  switch (type) {
    case 'person': return 'bg-blue-500';
    case 'organization': return 'bg-green-500';
    case 'location': return 'bg-red-500';
    case 'document': return 'bg-yellow-500';
    case 'transaction': return 'bg-purple-500';
    case 'image': return 'bg-pink-500';
    case 'video': return 'bg-indigo-500';
    case 'email': return 'bg-orange-500';
    case 'phone': return 'bg-teal-500';
    default: return 'bg-gray-500';
  }
};

export const EntityNode: React.FC<EntityNodeProps> = ({
  entity,
  isSelected,
  onSelect,
  onConnect,
  onToggleVisibility,
  onDelete,
  scale = 1,
  isOverlay
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: entity.id,
    data: { entity },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (isOverlay) {
    return (
      <div className="flex items-center gap-2 p-2 rounded border bg-white shadow-lg border-blue-500">
        {renderEntityIcon(entity.type)}
        <div className="font-medium text-sm">{entity.name}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        absolute cursor-pointer select-none transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}
        ${isDragging ? 'opacity-50 scale-110' : 'hover:scale-105'}
        ${!entity.visible ? 'opacity-50' : ''}
      `}
      onClick={() => onSelect(entity)}
      onDoubleClick={() => onConnect?.(entity)}
      {...listeners}
      {...attributes}
    >
      <div className={`
        flex flex-col items-center p-3 rounded-lg shadow-lg border-2 min-w-[120px]
        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
        ${scale < 0.7 ? 'p-2 min-w-[100px]' : ''}
        ${scale < 0.5 ? 'p-1 min-w-[80px]' : ''}
      `}>
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center mb-2
          ${getEntityColor(entity.type)}
          ${scale < 0.7 ? 'w-6 h-6' : ''}
          ${scale < 0.5 ? 'w-4 h-4' : ''}
        `}>
          {renderEntityIcon(entity.type, `text-white ${scale < 0.7 ? 'w-4 h-4' : 'w-5 h-5'} ${scale < 0.5 ? 'w-3 h-3' : ''}`)}
        </div>

        {scale > 0.3 && (
          <div className="text-center">
            <div className={`
              font-semibold text-gray-900 dark:text-white truncate max-w-[100px]
              ${scale < 0.7 ? 'text-xs' : 'text-sm'}
            `}>
              {entity.name}
            </div>
            {scale > 0.7 && (
              <Badge variant="outline" className="text-xs mt-1">
                {entity.type}
              </Badge>
            )}
          </div>
        )}

        {scale > 0.5 && (
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onToggleVisibility?.(entity.id);
              }}
            >
              {entity.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete?.(entity.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};