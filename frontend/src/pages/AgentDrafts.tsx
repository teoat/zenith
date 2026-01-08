// Agent Drafts page - Refactored
import React, { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAgentDrafts } from '@/hooks/useAgentDrafts';
import { AgentDraft } from '@/types/api';

// Sub-components
import { DraftStats } from '@/components/features/agents/DraftStats';
import { DraftFilters } from '@/components/features/agents/DraftFilters';
import { DraftCard } from '@/components/features/agents/DraftCard';
import { DraftEditModal } from '@/components/features/agents/DraftEditModal';
import LoadingState from '@/components/LoadingState';

const AgentDrafts: React.FC = () => {
  const { toast } = useToast();
  const { drafts, isLoading, isError, updateDraft } = useAgentDrafts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingDraft, setEditingDraft] = useState<AgentDraft | null>(null);
  const [editContent, setEditContent] = useState('');

  const filteredDrafts = useMemo(() => {
    return drafts.filter(draft => {
      const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || draft.status === statusFilter;
      const matchesType = typeFilter === 'all' || draft.draftType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [drafts, searchTerm, statusFilter, typeFilter]);

  const handleEdit = (draft: AgentDraft) => {
    setEditingDraft(draft);
    setEditContent(draft.content);
  };

  const handleSave = (content: string) => {
    if (!editingDraft) return;

    updateDraft({ 
        id: editingDraft.id, 
        updates: { content, status: 'reviewing', lastModified: new Date().toISOString() } 
    }, {
        onSuccess: () => {
            setEditingDraft(null);
            setEditContent('');
            toast({
                title: 'Draft Updated',
                description: 'Draft has been saved and marked for review',
            });
        },
        onError: () => {
            toast({
                title: 'Update Failed',
                description: 'Could not save draft changes',
                variant: 'destructive'
            });
        }
    });
  };

  const handleStatusChange = (id: string, newStatus: AgentDraft['status']) => {
    updateDraft({ 
        id, 
        updates: { status: newStatus, lastModified: new Date().toISOString() } 
    }, {
        onSuccess: () => {
            toast({
                title: 'Status Updated',
                description: `Draft status changed to ${newStatus}`,
            });
        }
    });
  };

  if (isLoading) {
    return <div className="p-6"><LoadingState text="Loading Agent Drafts..." /></div>;
  }

  if (isError) {
      return (
          <div className="p-6 text-center">
              <p className="text-red-500">Failed to load agent drafts.</p>
          </div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Drafts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Review and edit AI-generated content drafts
          </p>
        </div>
      </div>

      <DraftStats drafts={drafts} />

      <DraftFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrafts.map((draft) => (
          <DraftCard 
            key={draft.id}
            draft={draft}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {filteredDrafts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No agent drafts available at this time'}
          </p>
        </div>
      )}

      <DraftEditModal 
        draft={editingDraft}
        isOpen={!!editingDraft}
        onClose={() => setEditingDraft(null)}
        onSave={handleSave}
        content={editContent}
        onContentChange={setEditContent}
      />
    </div>
  );
};

export default AgentDrafts;