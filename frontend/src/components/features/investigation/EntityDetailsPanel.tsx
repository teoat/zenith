import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Entity, Relationship } from '@/types/investigation';

interface EntityDetailsPanelProps {
  entity: Entity;
  relationships: Relationship[];
  allEntities: Entity[];
  readOnly: boolean;
  onDelete: (id: string) => void;
}

export const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  entity,
  relationships,
  allEntities,
  readOnly,
  onDelete
}) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold">{entity.name}</h3>
        <Badge variant="outline" className="mt-1">
          {entity.type}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="properties">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div>
              <span className="text-sm font-medium">Risk Score</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${entity.riskScore || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {entity.riskScore || 0}
                </span>
              </div>
            </div>

            {Object.entries(entity.properties).map(([key, value]) => (
              <div key={key}>
                <label className="text-sm font-medium capitalize">
                  {key.replace('_', ' ')}
                </label>
                <p className="text-sm text-gray-600 mt-1">{String(value)}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="connections">
            <div className="space-y-2">
              {relationships
                .filter(r => r.source === entity.id || r.target === entity.id)
                .map(relationship => {
                  const otherId = relationship.source === entity.id
                    ? relationship.target
                    : relationship.source;
                  const otherEntity = allEntities.find(e => e.id === otherId);

                  return (
                    <div key={relationship.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">
                          {relationship.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {otherEntity?.name}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {relationship.strength}%
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="evidence">
            <div className="text-center text-gray-500 py-8">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No evidence linked yet</p>
              <Button size="sm" className="mt-2">
                Link Evidence
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {!readOnly && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(entity.id)}
            className="w-full"
          >
            Delete Entity
          </Button>
        </div>
      )}
    </div>
  );
};
