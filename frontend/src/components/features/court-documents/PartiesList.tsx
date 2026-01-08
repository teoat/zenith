import React from 'react';
import { Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Party } from '@/types/court-documents';

interface PartiesListProps {
  parties: Party[];
  onAdd: () => void;
  onUpdate: (idx: number, updates: Partial<Party>) => void;
  onRemove: (idx: number) => void;
}

export const PartiesList: React.FC<PartiesListProps> = ({
  parties,
  onAdd,
  onUpdate,
  onRemove
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Parties Involved</Label>
        <Button variant="outline" size="sm" onClick={onAdd} className="h-8 text-xs font-bold gap-2 bg-white">
          <Plus className="w-3 h-3" />
          Add Party
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.map((party, idx) => (
          <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-400">Name</Label>
              <Input
                value={party.name}
                onChange={(e) => onUpdate(idx, { name: e.target.value })}
                placeholder="Full Legal Name"
                className="h-9"
              />
            </div>
            <div className="w-32 space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-400">Role</Label>
              <Select
                value={party.role}
                onValueChange={(val) => onUpdate(idx, { role: val as Party['role'] })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plaintiff">Plaintiff</SelectItem>
                  <SelectItem value="defendant">Defendant</SelectItem>
                  <SelectItem value="witness">Witness</SelectItem>
                  <SelectItem value="affiant">Affiant</SelectItem>
                  <SelectItem value="petitioner">Petitioner</SelectItem>
                  <SelectItem value="respondent">Respondent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => onRemove(idx)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {parties.length === 0 && (
          <div className="md:col-span-2 py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm italic">
            No parties added yet. Click 'Add Party' to begin.
          </div>
        )}
      </div>
    </div>
  );
};
