import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Link, Download } from 'lucide-react';

import { useCollaboration } from '@/hooks/useCollaboration';
import { Entity, Relationship, Evidence } from '@/types/investigation';

import { InvestigationSidebar } from '@/components/features/investigation/InvestigationSidebar';
import { EntityDetailsPanel } from '@/components/features/investigation/EntityDetailsPanel';
import { InvestigationGraph } from '@/components/features/investigation/InvestigationGraph';
import { EntityForm } from '@/components/features/investigation/EntityForm';
import { RelationshipForm } from '@/components/features/investigation/RelationshipForm';

interface InvestigationCanvasProps {
  caseId: string;
  initialEntities?: Entity[];
  initialRelationships?: Relationship[];
  onSave?: (data: { entities: Entity[], relationships: Relationship[] }) => void;
  onExport?: (format: 'json' | 'pdf' | 'image') => void;
  readOnly?: boolean;
}

export const InvestigationCanvas: React.FC<InvestigationCanvasProps> = ({
  caseId,
  initialEntities = [],
  initialRelationships = [],
  onSave,
  onExport,
  readOnly = false
}) => {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [connectingEntity, setConnectingEntity] = useState<Entity | null>(null);
  
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);

  // Example Evidence (mock)
  const evidence: Evidence[] = [
    { id: 'ev1', type: 'document', filename: 'Report.pdf', url: '#' },
    { id: 'ev2', type: 'image', filename: 'Evidence.jpg', url: '#' }
  ];

  // Graph Ref
  const fgRef = useRef<any>(null);

  useCollaboration(caseId);

  // -- Handlers --

  const handleEntitySelect = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
  }, []);

  const handleEntityConnect = useCallback((entity: Entity) => {
    if (connectingEntity && connectingEntity.id !== entity.id) {
      const relationship: Relationship = {
        id: `rel_${Date.now()}`,
        source: connectingEntity.id,
        target: entity.id,
        type: 'related_to',
        strength: 50,
        evidence: [],
        properties: {}
      };
      setRelationships(prev => [...prev, relationship]);
      setConnectingEntity(null);
      setShowRelationshipDialog(true);
    } else {
      setConnectingEntity(entity);
    }
  }, [connectingEntity]);

  const handleAddEntity = useCallback((entityData: Partial<Entity>) => {
    const newEntity: Entity = {
      id: `entity_${Date.now()}`,
      type: entityData.type || 'person',
      name: entityData.name || 'New Entity',
      properties: entityData.properties || {},
      riskScore: entityData.riskScore,
      connections: [],
      x: undefined,
      y: undefined,
      fx: undefined,
      fy: undefined
    } as Entity;
    setEntities(prev => [...prev, newEntity]);
    setShowEntityDialog(false);
  }, []);

  const handleDeleteEntity = useCallback((entityId: string) => {
    setEntities(prev => prev.filter(e => e.id !== entityId));
    setRelationships(prev => prev.filter(r => r.source !== entityId && r.target !== entityId));
    if (selectedEntity?.id === entityId) {
      setSelectedEntity(null);
    }
  }, [selectedEntity]);

  const handleZoomIn = useCallback(() => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.2, 400);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.2, 400);
  }, []);

  const handleResetView = useCallback(() => {
    if (fgRef.current) fgRef.current.zoomToFit(400);
  }, []);

  const handleSaveWrapper = useCallback(() => {
    if (onSave) onSave({ entities, relationships });
  }, [entities, relationships, onSave]);

  const handleExportWrapper = useCallback((format: 'json' | 'pdf' | 'image') => {
    if (onExport) onExport(format);
  }, [onExport]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full bg-gray-50">
        <InvestigationSidebar
            entities={entities}
            selectedEntityId={selectedEntity?.id}
            readOnly={readOnly}
            onSelectEntity={handleEntitySelect}
            onConnectEntity={handleEntityConnect}
            onAddEntity={() => setShowEntityDialog(true)}
            onSave={handleSaveWrapper}
            evidence={evidence}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomIn} aria-label="Zoom in">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleZoomOut} aria-label="Zoom out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetView} aria-label="Reset view">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-gray-500">
                  {entities.length} entities, {relationships.length} relationships
                </span>
              </div>

              <div className="flex items-center gap-2">
                {connectingEntity && (
                  <Badge variant="secondary">
                    <Link className="w-3 h-3 mr-1" />
                    Connecting: {connectingEntity.name}
                  </Badge>
                )}
                <Button size="sm" variant="outline" onClick={() => handleExportWrapper('json')}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          <InvestigationGraph
            ref={fgRef}
            entities={entities}
            relationships={relationships}
            onNodeClick={handleEntitySelect}
            onNodeDragEnd={(updatedEntity) => {
                setEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
            }}
          />
        </div>

        {selectedEntity && (
            <EntityDetailsPanel
                entity={selectedEntity}
                relationships={relationships}
                allEntities={entities}
                readOnly={readOnly}
                onDelete={handleDeleteEntity}
            />
        )}

        <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Entity</DialogTitle>
            </DialogHeader>
            <EntityForm onSubmit={handleAddEntity} />
          </DialogContent>
        </Dialog>

        <Dialog open={showRelationshipDialog} onOpenChange={setShowRelationshipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Relationship</DialogTitle>
            </DialogHeader>
            <RelationshipForm
              relationship={relationships[relationships.length - 1]}
              onSubmit={(updatedRel) => {
                setRelationships(prev => prev.map(r =>
                  r.id === updatedRel.id ? updatedRel : r
                ));
                setShowRelationshipDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
};