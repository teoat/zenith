import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx'';
import { Search, Filter } from 'lucide-react';

interface EvidenceSearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
}

export const EvidenceSearchFilters: React.FC<EvidenceSearchFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType
}) => {
  return (
    <div className="flex items-center space-x-2 px-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search filename or ID..."
          className="pl-8 w-64 bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
      </div>
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-[150px] bg-slate-50 dark:bg-slate-900 border-none focus:ring-1 focus:ring-blue-500">
          <Filter className="h-4 w-4 mr-2 text-gray-400" />
          <SelectValue placeholder="File Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="pdf">PDF Documents</SelectItem>
          <SelectItem value="image">Images</SelectItem>
          <SelectItem value="video">Security Video</SelectItem>
          <SelectItem value="audio">Audio Recordings</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
