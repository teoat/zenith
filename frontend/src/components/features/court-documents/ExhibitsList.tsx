import React from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Exhibit } from '@/types/court-documents';

interface ExhibitsListProps {
  exhibits: Exhibit[];
  onAdd: () => void;
  onUpdate: (idx: number, updates: Partial<Exhibit>) => void;
  onRemove: (idx: number) => void;
}

export const ExhibitsList: React.FC<ExhibitsListProps> = ({
  exhibits,
  onAdd,
  onUpdate,
  onRemove
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Exhibit List</Label>
        <Button variant="outline" size="sm" onClick={onAdd} className="h-8 text-xs font-bold gap-2 bg-white">
          <Plus className="w-3 h-3" />
          Add Exhibit
        </Button>
      </div>

      <div className="space-y-2">
        {exhibits.map((exhibit, idx) => (
          <div key={exhibit.id} className="flex gap-3 items-center bg-white p-2 pl-3 rounded-lg border border-slate-200 group">
            <Badge variant="secondary" className="h-7 min-w-[32px] justify-center bg-blue-50 text-blue-700 border-blue-100 font-mono">
              {exhibit.label.replace('Exhibit ', '')}
            </Badge>
            <Input
              value={exhibit.description}
              onChange={(e) => onUpdate(idx, { description: e.target.value })}
              placeholder="Description of the exhibit (e.g., 'Bank Statement dated 2024-01-01')"
              className="flex-1 h-9 border-none bg-transparent focus-visible:ring-0 shadow-none text-sm"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(idx)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {exhibits.length === 0 && (
          <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic">
            No exhibits attached.
          </div>
        )}
      </div>
    </div>
  );
};
