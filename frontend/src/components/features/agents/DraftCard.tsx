import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Clock, Eye, Edit, CheckCircle, X } from 'lucide-react';
import { AccessibleButton } from '@/components/ui/AccessibleButton';
import { AgentDraft } from '@/types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DraftCardProps {
  draft: AgentDraft;
  onEdit: (draft: AgentDraft) => void;
  onStatusChange: (id: string, newStatus: AgentDraft['status']) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ draft, onEdit, onStatusChange }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reviewing': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'rejected': return <X className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      reviewing: 'secondary',
      rejected: 'destructive',
      draft: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{draft.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Bot className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">{draft.agentName}</span>
            </div>
          </div>
          {getStatusIcon(draft.status)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {getStatusBadge(draft.status)}
          <Badge variant="outline">{draft.draftType}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(draft.lastModified).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Target Entity</p>
            <p className="font-mono text-sm">{draft.targetEntity}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${draft.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm">{Math.round(draft.confidence * 100)}%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {draft.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <AccessibleButton
                  variant="outline"
                  size="sm"
                  aria-label={`View draft ${draft.title}`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </AccessibleButton>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{draft.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Agent:</strong> {draft.agentName}
                    </div>
                    <div>
                      <strong>Confidence:</strong> {Math.round(draft.confidence * 100)}%
                    </div>
                    <div>
                      <strong>Type:</strong> {draft.draftType}
                    </div>
                    <div>
                      <strong>Status:</strong> {draft.status}
                    </div>
                  </div>
                  <div>
                    <strong>Content:</strong>
                    <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                      {draft.content}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {draft.status === 'draft' && (
              <AccessibleButton
                onClick={() => onEdit(draft)}
                variant="outline"
                size="sm"
                aria-label={`Edit draft ${draft.title}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </AccessibleButton>
            )}

            {draft.status === 'reviewing' && (
              <div className="flex gap-1">
                <AccessibleButton
                  onClick={() => onStatusChange(draft.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                  aria-label={`Approve draft ${draft.title}`}
                >
                  <CheckCircle className="w-4 h-4" />
                </AccessibleButton>
                <AccessibleButton
                  onClick={() => onStatusChange(draft.id, 'rejected')}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  size="sm"
                  aria-label={`Reject draft ${draft.title}`}
                >
                  <X className="w-4 h-4" />
                </AccessibleButton>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
