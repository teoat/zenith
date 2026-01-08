import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { AgentDraft } from '@/types/api';

interface DraftEditModalProps {
  draft: AgentDraft | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  content: string;
  onContentChange: (content: string) => void;
}

export const DraftEditModal: React.FC<DraftEditModalProps> = ({
  draft,
  isOpen,
  onClose,
  onSave,
  content,
  onContentChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Draft: {draft?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Edit draft content..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(content)}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
