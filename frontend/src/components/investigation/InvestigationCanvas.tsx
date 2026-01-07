/**
 * Interactive Investigation Workflow Component
 * Provides investigation canvas with entity relationships
 */

import * as React from "react";
import { useState, useCallback, useRef, Suspense } from "react";
import {
  DndContext,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/Separator";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useCollaboration } from "@/hooks/useCollaboration";
import type { Entity, Relationship, Evidence } from "@/types/investigation";
import { secureLogger } from "@/utils/secureLogger";
import {
  Plus,
  Search,
  Save,
  Download,
  Eye,
  EyeOff,
  Link,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

// Lazy imports for code splitting
const ForceGraph2D = React.lazy(() => import("react-force-graph-2d"));

// Lazy imports for forms
const EntityForm = React.lazy(() => import("./EntityForm"));
const RelationshipForm = React.lazy(() => import("./RelationshipForm"));

// Extracted components
import { EntityNode } from "./EntityNode";
import { EvidenceItem } from "./EvidenceItem";
import { CanvasArea } from "./CanvasArea";

interface InvestigationCanvasProps {
  caseId: string;
  initialEntities?: Entity[];
  initialRelationships?: Relationship[];
  onSave?: (data: {
    entities: Entity[];
    relationships: Relationship[];
  }) => void;
  onExport?: (format: "json" | "pdf" | "image") => void;
  readOnly?: boolean;
}

// Graph Types
interface GraphNode extends Entity {
  val: number;
  color: string;
  // Required by react-force-graph
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  vx?: number;
  vy?: number;
  [key: string]: unknown; // Allow arbitrary properties used by d3/force-graph
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  strength: number;
  color: string;
  width: number;
  [key: string]: unknown;
}

// Evidence type is now imported from types/investigation.ts

// Main Investigation Canvas Component
export const InvestigationCanvas: React.FC<InvestigationCanvasProps> = ({
  caseId,
  initialEntities = [],
  initialRelationships = [],
  onSave,
  onExport,
  readOnly = false,
}) => {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [relationships, setRelationships] =
    useState<Relationship[]>(initialRelationships);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [connectingEntity, setConnectingEntity] = useState<Entity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showEvidence, setShowEvidence] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<{
    type: "entity" | "evidence";
    item: Entity | Evidence;
  } | null>(null);

  const evidence: Evidence[] = [
    { id: "ev1", type: "document", filename: "Report.pdf", url: "#" },
    { id: "ev2", type: "image", filename: "Evidence.jpg", url: "#" },
  ];

  const [zoom, setZoom] = useState(1);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  // Dnd Context Hook for Droppable Area
  const { setNodeRef } = useDroppable({
    id: "investigation-canvas",
  });

  useCollaboration(caseId);

  const getNodeColor = useCallback((entity: Entity) => {
    if (entity.riskScore && entity.riskScore >= 80) return "#ef4444"; // red
    if (entity.riskScore && entity.riskScore >= 60) return "#f97316"; // orange
    if (entity.riskScore && entity.riskScore >= 40) return "#eab308"; // yellow
    return "#22c55e"; // green
  }, []);

  const getLinkColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      owns: "#3b82f6", // blue
      transacts_with: "#10b981", // green
      located_at: "#8b5cf6", // purple
      related_to: "#f59e0b", // amber
      controls: "#ef4444", // red
      beneficial_owner: "#ec4899", // pink
    };
    return colors[type] || "#6b7280";
  }, []);

  // Update graph data when entities or relationships change
  const graphData = React.useMemo(() => {
    const nodes: GraphNode[] = entities.map((entity) => ({
      ...entity,
      val: Math.max(1, (entity.riskScore || 0) / 20),
      color: getNodeColor(entity),
      fx: entity.fx ?? undefined,
      fy: entity.fy ?? undefined,
    }));

    const links: GraphLink[] = relationships.map((rel) => ({
      source: rel.source,
      target: rel.target,
      type: rel.type,
      strength: rel.strength,
      color: getLinkColor(rel.type),
      width: Math.max(1, rel.strength / 20),
    }));

    return { nodes, links };
  }, [entities, relationships, getNodeColor, getLinkColor]);

  const handleEntitySelect = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
  }, []);

  const handleEntityConnect = useCallback(
    (entity: Entity) => {
      if (connectingEntity && connectingEntity.id !== entity.id) {
        // Create relationship
        const relationship: Relationship = {
          id: `rel_${Date.now()}`,
          source: connectingEntity.id,
          target: entity.id,
          type: "related_to",
          strength: 50,
          evidence: [],
          properties: {},
        };
        setRelationships((prev) => [...prev, relationship]);
        setConnectingEntity(null);
        setShowRelationshipDialog(true);
      } else {
        setConnectingEntity(entity);
      }
    },
    [connectingEntity],
  );

  const handleAddEntity = useCallback((entityData: Partial<Entity>) => {
    const newEntity: Entity = {
      id: `entity_${Date.now()}`,
      type: entityData.type || "person",
      name: entityData.name || "New Entity",
      properties: entityData.properties || {},
      riskScore: entityData.riskScore,
      connections: [],
      x: undefined,
      y: undefined,
      fx: undefined,
      fy: undefined,
    } as Entity;
    setEntities((prev) => [...prev, newEntity]);
    setShowEntityDialog(false);
  }, []);

  const handleDeleteEntity = useCallback(
    (entityId: string) => {
      setEntities((prev) => prev.filter((e) => e.id !== entityId));
      setRelationships((prev) =>
        prev.filter((r) => r.source !== entityId && r.target !== entityId),
      );
      if (selectedEntity?.id === entityId) {
        setSelectedEntity(null);
      }
    },
    [selectedEntity],
  );

  const handleToggleVisibility = useCallback((entityId: string) => {
    setEntities((prev) =>
      prev.map((entity) =>
        entity.id === entityId
          ? { ...entity, visible: !entity.visible }
          : entity,
      ),
    );
  }, []);

  const handleZoomIn = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoom(zoom * 1.2);
      setZoom(zoom * 1.2);
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoom(zoom / 1.2);
      setZoom(zoom / 1.2);
    }
  }, [zoom]);

  const handleResetView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit();
      setZoom(1);
    }
  }, []);

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch = entity.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || entity.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ entities, relationships });
    }
  }, [entities, relationships, onSave]);

  const handleExport = useCallback(
    (format: "json" | "pdf" | "image") => {
      if (onExport) {
        onExport(format);
      }
    },
    [onExport],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(
      event.active.data.current as {
        type: "entity" | "evidence";
        item: Entity | Evidence;
      } | null,
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { over, active } = event;

    // Drop on Canvas
    if (over && over.id === "investigation-canvas") {
      const data = active.data.current;
      if (data && data.type === "entity") {
        // Check if entity is already in list (it is, since we drag from list)
        secureLogger.warn("Dropped entity on canvas", data.entity.name);
      } else if (data && data.type === "evidence") {
        secureLogger.warn("Dropped evidence on canvas", data.evidence.filename);
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full bg-gray-50">
        {/* Left Sidebar - Entities & Tools */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Investigation Canvas</h2>
              {!readOnly && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowEntityDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Entity
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSave}>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
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
              {filteredEntities.map((entity) => (
                <EntityNode
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedEntity?.id === entity.id}
                  onSelect={handleEntitySelect}
                  onConnect={handleEntityConnect}
                  onToggleVisibility={handleToggleVisibility}
                  onDelete={handleDeleteEntity}
                  scale={zoom}
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
              {showEvidence ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showEvidence ? "Hide Evidence" : "Show Evidence"}
            </Button>
          </div>

          {/* Evidence Panel */}
          {showEvidence && (
            <div className="border-t border-gray-200 p-4">
              <h3 className="font-medium mb-2">Evidence Library</h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {evidence.map((item) => (
                    <EvidenceItem key={item.id} evidence={item} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetView}
                  aria-label="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-gray-500">
                  {entities.length} entities, {relationships.length}{" "}
                  relationships
                </span>
              </div>

              <div className="flex items-center gap-2">
                {connectingEntity && (
                  <Badge variant="secondary">
                    <Link className="w-3 h-3 mr-1" />
                    Connecting: {connectingEntity.name}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport("json")}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Force Graph Canvas */}
          <CanvasArea setNodeRef={setNodeRef}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  Loading Graph...
                </div>
              }
            >
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData as any}
                nodeLabel={(node: any) => `${node.name} (${node.type})`}
                nodeColor={(node: any) => node.color}
                nodeVal={(node: any) => node.val}
                linkColor={(link: any) => link.color}
                linkWidth={(link: any) => link.width}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                onNodeClick={(node: any) => {
                  const entity = entities.find((e) => e.id === node.id);
                  if (entity) {
                    handleEntitySelect(entity);
                  }
                }}
                onNodeDragEnd={(node: any) => {
                  setEntities((prev) =>
                    prev.map((entity) =>
                      entity.id === node.id &&
                      node.x !== undefined &&
                      node.y !== undefined
                        ? {
                            ...entity,
                            fx: node.x ?? undefined,
                            fy: node.y ?? undefined,
                          }
                        : entity,
                    ),
                  );
                }}
                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
              />
            </Suspense>
          </CanvasArea>
        </div>

        {/* Right Sidebar - Entity Details */}
        {selectedEntity && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">{selectedEntity.name}</h3>
              <Badge variant="outline" className="mt-1">
                {selectedEntity.type}
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
                          className="bg-blue-600 h-full rounded bar-fill"
                          /* eslint-disable-next-line react/forbid-dom-props */
                          style={
                            {
                              "--width": `${selectedEntity.riskScore || 0}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {selectedEntity.riskScore || 0}
                      </span>
                    </div>
                  </div>

                  {Object.entries(selectedEntity.properties).map(
                    ([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium capitalize">
                          {key.replace("_", " ")}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          {String(value)}
                        </p>
                      </div>
                    ),
                  )}
                </TabsContent>

                <TabsContent value="connections">
                  <div className="space-y-2">
                    {relationships
                      .filter(
                        (r) =>
                          r.source === selectedEntity.id ||
                          r.target === selectedEntity.id,
                      )
                      .map((relationship) => {
                        const otherId =
                          relationship.source === selectedEntity.id
                            ? relationship.target
                            : relationship.source;
                        const otherEntity = entities.find(
                          (e) => e.id === otherId,
                        );

                        return (
                          <div
                            key={relationship.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {relationship.type.replace("_", " ")}
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
                  onClick={() => handleDeleteEntity(selectedEntity.id)}
                  className="w-full"
                >
                  Delete Entity
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Add Entity Dialog */}
        <Dialog open={showEntityDialog} onOpenChange={setShowEntityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Entity</DialogTitle>
            </DialogHeader>
            <EntityForm onSubmit={handleAddEntity} />
          </DialogContent>
        </Dialog>

        {/* Relationship Dialog */}
        <Dialog
          open={showRelationshipDialog}
          onOpenChange={setShowRelationshipDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Relationship</DialogTitle>
            </DialogHeader>
            <RelationshipForm
              relationship={relationships[relationships.length - 1]}
              onSubmit={(updatedRel) => {
                setRelationships((prev) =>
                  prev.map((r) => (r.id === updatedRel.id ? updatedRel : r)),
                );
                setShowRelationshipDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && activeDragItem.type === "entity" && (
            <EntityNode
              entity={activeDragItem.item as Entity}
              isSelected={false}
              onSelect={() => {}}
              onConnect={() => {}}
              isOverlay
            />
          )}
          {activeDragItem && activeDragItem.type === "evidence" && (
            <EvidenceItem
              evidence={activeDragItem.item as Evidence}
              isOverlay
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

// EntityForm and RelationshipForm are now lazy-loaded from separate files

export default InvestigationCanvas;
