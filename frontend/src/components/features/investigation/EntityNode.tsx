import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { Users, Building, DollarSign, Target, MapPin, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Entity, ItemTypes } from '@/types/investigation';
import { cn } from '@/lib/utils';

interface EntityNodeProps {
  entity: Entity;
  isSelected: boolean;
  onSelect: (entity: Entity) => void;
  onConnect: (entity: Entity) => void;
}

export const EntityNode: React.FC<EntityNodeProps> = ({ entity, isSelected, onSelect, onConnect }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ENTITY,
    item: entity,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person': return <Users className="w-4 h-4" />;
      case 'company': return <Building className="w-4 h-4" />;
      case 'account': return <DollarSign className="w-4 h-4" />;
      case 'transaction': return <Target className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getRiskColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(entity);
        }
      }}
      onClick={() => onSelect(entity)}
      onDoubleClick={() => onConnect(entity)}
    >
      {getEntityIcon(entity.type)}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{entity.name}</div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {entity.type}
          </Badge>
          {entity.riskScore !== undefined && (
            <Badge className={cn("text-xs", getRiskColor(entity.riskScore))}>
              {entity.riskScore}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
