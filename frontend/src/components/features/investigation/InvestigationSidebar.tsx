import React, { useState } from 'react';
import { Plus, Save, Search, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Entity, Evidence } from '@/types/investigation';
import { EntityNode } from './EntityNode';
import { EvidenceItem } from './EvidenceItem';

interface InvestigationSidebarProps {
  entities: Entity[];
  selectedEntityId: string | undefined;
  readOnly: boolean;
  onSelectEntity: (entity: Entity) => void;
  onConnectEntity: (entity: Entity) => void;
  onAddEntity: () => void;
  onSave: () => void;
  evidence: Evidence[];
}

export const InvestigationSidebar: React.FC<InvestigationSidebarProps> = ({
  entities,
  selectedEntityId,
  readOnly,
  onSelectEntity,
  onConnectEntity,
  onAddEntity,
  onSave,
  evidence
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showEvidence, setShowEvidence] = useState(false);

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entity.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Investigation Canvas</h2>
          {!readOnly && (
            <div className="flex gap-2">
              <Button size="sm" onClick={onAddEntity}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={onSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="person">People</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="account">Accounts</SelectItem>
              <SelectItem value="transaction">Transactions</SelectItem>
              <SelectItem value="location">Locations</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Entities List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredEntities.map(entity => (
            <EntityNode
              key={entity.id}
              entity={entity}
              isSelected={selectedEntityId === entity.id}
              onSelect={onSelectEntity}
              onConnect={onConnectEntity}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Evidence Panel Toggle */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowEvidence(!showEvidence)}
        >
          {showEvidence ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showEvidence ? 'Hide Evidence' : 'Show Evidence'}
        </Button>
      </div>

      {/* Evidence Panel */}
      {showEvidence && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="font-medium mb-2">Evidence Library</h3>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {evidence.map(item => (
                <EvidenceItem
                  key={item.id}
                  evidence={item}
                  onDrag={(ev) => console.log('Evidence dragged:', ev)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
