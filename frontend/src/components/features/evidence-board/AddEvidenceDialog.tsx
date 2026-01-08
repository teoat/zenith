import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EvidenceCard } from '@/types/evidence';

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (evidence: Partial<EvidenceCard>) => void;
}

export const AddEvidenceDialog: React.FC<AddEvidenceDialogProps> = ({
  open,
  onOpenChange,
  onAdd
}) => {
  const [formData, setFormData] = useState<Partial<EvidenceCard>>({
    title: '',
    type: 'note',
    content: '',
    priority: 'medium'
  });

  const handleSubmit = () => {
    onAdd(formData);
    setFormData({ title: '', type: 'note', content: '', priority: 'medium' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Add New Evidence</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Bank Statement Analysis"
              className="bg-slate-50 border-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as EvidenceCard['type'] }))}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val as EvidenceCard['priority'] }))}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-400">Description / Content</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Core findings or content summary..."
              className="min-h-[100px] bg-slate-50 border-slate-100 resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold border-slate-200">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 font-bold min-w-[120px]">
            Add Evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
