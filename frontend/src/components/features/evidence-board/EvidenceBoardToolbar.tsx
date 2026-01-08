import React from 'react';
import { Search, Plus, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface EvidenceBoardToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterStatus: string;
  onFilterChange: (val: string) => void;
  isConnecting: boolean;
  onAddClick: () => void;
}

export const EvidenceBoardToolbar: React.FC<EvidenceBoardToolbarProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  isConnecting,
  onAddClick
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search evidence cards..."
            className="pl-9 bg-white"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-36 bg-white shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {isConnecting && (
          <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-amber-50 text-amber-700 border-amber-200 animate-pulse font-bold">
            <Link2 className="w-3 h-3" />
            Pick target component
          </Badge>
        )}
        <Button onClick={onAddClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-100">
          <Plus className="w-4 h-4" />
          Add Evidence
        </Button>
      </div>
    </div>
  );
};
