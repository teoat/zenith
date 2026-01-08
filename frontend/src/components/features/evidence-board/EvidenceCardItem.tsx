import React from 'react';
import { 
  FileText, Image as ImageIcon, Video, Mail, File, MessageSquare, 
  MoreVertical, Link2, Pin, Users, Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { EvidenceCard } from '@/types/evidence';
import { cn } from '@/lib/utils';

interface EvidenceCardItemProps {
  evidence: EvidenceCard;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: () => void;
  onConnect: () => void;
}

export const EvidenceCardItem: React.FC<EvidenceCardItemProps> = ({
  evidence,
  isSelected,
  isConnecting,
  onSelect,
  onConnect
}) => {
  const getTypeIcon = (type: EvidenceCard['type']) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'transaction': return <File className="w-4 h-4" />;
      case 'note': return <MessageSquare className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: EvidenceCard['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reviewing': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'flagged': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: EvidenceCard['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-600';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div
      className={cn(
        "evidence-card absolute w-[280px] bg-white rounded-xl shadow-lg border-2 transition-all cursor-pointer group",
        isSelected ? "border-blue-500 ring-4 ring-blue-50" : "border-slate-200 hover:border-slate-300",
        isConnecting && "ring-4 ring-amber-400 border-amber-400 animate-pulse"
      )}
      style={{ left: evidence.position.x, top: evidence.position.y }}
      onClick={onSelect}
    >
      <div className={cn("h-1.5 w-full rounded-t-[10px]", getPriorityColor(evidence.priority))} />
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500">
               {getTypeIcon(evidence.type)}
            </div>
            <h4 className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{evidence.title}</h4>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {evidence.content}
        </p>

        <div className="flex flex-wrap gap-1">
          {evidence.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-500 font-medium">
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <Badge className={cn("text-[10px] uppercase font-bold px-2 py-0.5", getStatusColor(evidence.status))}>
            {evidence.status}
          </Badge>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Link2 className="w-3 h-3" />
                <span>{evidence.connections.length}</span>
             </div>
             <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                onClick={(e) => { e.stopPropagation(); onConnect(); }}
              >
                <Pin className="w-3 h-3 mr-1" />
                Connect
              </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-50">
           <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              <span>{evidence.addedBy}</span>
           </div>
           <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>{new Date(evidence.addedAt).toLocaleDateString()}</span>
           </div>
        </div>
      </div>
    </div>
  );
};
