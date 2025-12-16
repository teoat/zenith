/**
 * EntityGraph3D - Phase 6E Advanced Visualization
 * 3D Force-Directed Graph with entity layering and risk visualization
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Slider } from '@/components/ui/slider'; // Unused
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Box,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Network,
  Users,
  Building,
  DollarSign,
  AlertTriangle,
  Download
} from 'lucide-react';
import './EntityGraph3D.css';

// Types
interface GraphEntity {
  id: string;
  name: string;
  type: 'person' | 'company' | 'account' | 'transaction' | 'location';
  riskScore: number;
  layer: number;
  connections: string[];
  properties: Record<string, unknown>;
}

interface GraphConnection {
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface EntityGraph3DProps {
  entities?: GraphEntity[];
  connections?: GraphConnection[];
  onEntityClick?: (entity: GraphEntity) => void;
  onConnectionClick?: (connection: GraphConnection) => void;
}

// Mock data generator
const generateMockData = () => {
  const entities: GraphEntity[] = [
    { id: 'e1', name: 'John Doe', type: 'person', riskScore: 85, layer: 0, connections: ['e2', 'e4'], properties: {} },
    { id: 'e2', name: 'Acme Corp', type: 'company', riskScore: 65, layer: 1, connections: ['e1', 'e3'], properties: {} },
    { id: 'e3', name: 'Account #1234', type: 'account', riskScore: 45, layer: 2, connections: ['e2', 'e5'], properties: {} },
    { id: 'e4', name: 'Shell LLC', type: 'company', riskScore: 92, layer: 1, connections: ['e1', 'e6'], properties: {} },
    { id: 'e5', name: 'Account #5678', type: 'account', riskScore: 30, layer: 2, connections: ['e3'], properties: {} },
    { id: 'e6', name: 'Offshore Ltd', type: 'company', riskScore: 88, layer: 1, connections: ['e4', 'e7'], properties: {} },
    { id: 'e7', name: 'Jane Smith', type: 'person', riskScore: 72, layer: 0, connections: ['e6', 'e8'], properties: {} },
    { id: 'e8', name: 'Account #9999', type: 'account', riskScore: 95, layer: 2, connections: ['e7'], properties: {} },
  ];

  const connections: GraphConnection[] = [
    { source: 'e1', target: 'e2', type: 'owns', weight: 80 },
    { source: 'e2', target: 'e3', type: 'controls', weight: 100 },
    { source: 'e1', target: 'e4', type: 'beneficial_owner', weight: 45 },
    { source: 'e3', target: 'e5', type: 'transacts_with', weight: 60 },
    { source: 'e4', target: 'e6', type: 'subsidiary', weight: 90 },
    { source: 'e6', target: 'e7', type: 'director', weight: 75 },
    { source: 'e7', target: 'e8', type: 'controls', weight: 100 },
  ];

  return { entities, connections };
};

// 3D Node visualization using CSS transforms
const GraphNode3D: React.FC<{
  entity: GraphEntity;
  position: { x: number; y: number; z: number };
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hover: boolean) => void;
}> = ({ entity, position, isSelected, isHovered, onClick, onHover }) => {
  const getRiskColor = (score: number) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return <Users className="w-4 h-4" />;
      case 'company': return <Building className="w-4 h-4" />;
      case 'account': return <DollarSign className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const scale = 1 + (position.z / 500);
  const opacity = 0.4 + (0.6 * (1 - position.z / 500));

  return (
    <div
      className={`graph-node-3d ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${scale}) translateZ(${position.z}px)`,
        opacity,
        zIndex: Math.round(1000 - position.z),
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div 
        className="node-circle"
        style={{ 
          background: `linear-gradient(135deg, ${getRiskColor(entity.riskScore)}, ${getRiskColor(entity.riskScore)}88)`,
          boxShadow: `0 0 20px ${getRiskColor(entity.riskScore)}40`
        }}
      >
        {getTypeIcon(entity.type)}
      </div>
      <div className="node-label">{entity.name}</div>
      {(isHovered || isSelected) && (
        <div className="node-tooltip">
          <div className="tooltip-header">
            <span className="font-medium">{entity.name}</span>
            <Badge variant="outline" className="ml-2 text-xs">{entity.type}</Badge>
          </div>
          <div className="tooltip-content">
            <div className="flex justify-between">
              <span>Risk Score</span>
              <span className="font-semibold" style={{ color: getRiskColor(entity.riskScore) }}>
                {entity.riskScore}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Connections</span>
              <span className="font-semibold">{entity.connections.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Layer</span>
              <span className="font-semibold">L{entity.layer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Connection Line Component
const ConnectionLine3D: React.FC<{
  connection: GraphConnection;
  sourcePos: { x: number; y: number; z: number };
  targetPos: { x: number; y: number; z: number };
  isHighlighted: boolean;
}> = ({ connection, sourcePos, targetPos, isHighlighted }) => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  return (
    <div
      className={`connection-line-3d ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        left: sourcePos.x + 25,
        top: sourcePos.y + 25,
        width: length,
        transform: `rotate(${angle}deg)`,
        opacity: isHighlighted ? 1 : 0.3,
      }}
    >
      <div className="line-inner" style={{ width: `${connection.weight}%` }} />
    </div>
  );
};

export const EntityGraph3D: React.FC<EntityGraph3DProps> = ({
  entities: propEntities,
  connections: propConnections,
  onEntityClick,
  onConnectionClick: _onConnectionClick,
}) => {
  const mockData = useMemo(() => generateMockData(), []);
  const entities = propEntities || mockData.entities;
  const connections = propConnections || mockData.connections;

  const [rotation, setRotation] = useState({ x: 15, y: -20 });
  const [zoom, setZoom] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [layerFilter, _setLayerFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'layered' | 'radial'>('3d');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Calculate 3D positions
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; z: number }>();
    const centerX = 350;
    const centerY = 250;

    entities.forEach((entity, index) => {
      let x = 0, y = 0, z = 0;

      switch (viewMode) {
        case 'layered':
          // Layered view - entities arranged by layer
          x = centerX + (Math.cos(index * 0.8) * 150);
          y = 100 + entity.layer * 150;
          z = 0;
          break;
        case 'radial': {
          // Radial view - entities arranged in circles by layer
          const layerRadius = 80 + entity.layer * 100;
          const angle = (index / entities.length) * 2 * Math.PI;
          x = centerX + Math.cos(angle) * layerRadius;
          y = centerY + Math.sin(angle) * layerRadius;
          z = 0;
          break;
        }
        default: {
          // 3D view with rotation
          const baseAngle = (index / entities.length) * 2 * Math.PI;
          const baseRadius = 120 + entity.layer * 60;
          const baseX = Math.cos(baseAngle) * baseRadius;
          const baseZ = Math.sin(baseAngle) * baseRadius;
          const baseY = (entity.layer - 1) * 80;

          // Apply rotation
          const radX = rotation.x * Math.PI / 180;
          const radY = rotation.y * Math.PI / 180;
          
          const rotatedY = baseY * Math.cos(radX) - baseZ * Math.sin(radX);
          const rotatedZ = baseY * Math.sin(radX) + baseZ * Math.cos(radX);
          const finalX = baseX * Math.cos(radY) + rotatedZ * Math.sin(radY);
          const finalZ = -baseX * Math.sin(radY) + rotatedZ * Math.cos(radY);

          x = centerX + finalX;
          y = centerY + rotatedY;
          z = 200 + finalZ;
        }
      }

      positions.set(entity.id, { x, y, z });
    });

    return positions;
  }, [entities, rotation, viewMode]);

  // Mouse handlers for 3D rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode === '3d') {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, [viewMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current && viewMode === '3d') {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setRotation(prev => ({
        x: Math.max(-60, Math.min(60, prev.x + dy * 0.5)),
        y: prev.y + dx * 0.5,
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, [viewMode]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Filter entities by layer
  const filteredEntities = useMemo(() => {
    if (layerFilter === null) return entities;
    return entities.filter(e => e.layer === layerFilter);
  }, [entities, layerFilter]);

  const handleEntityClick = useCallback((entity: GraphEntity) => {
    setSelectedEntity(prev => prev === entity.id ? null : entity.id);
    onEntityClick?.(entity);
  }, [onEntityClick]);

  // Statistics
  const stats = useMemo(() => {
    const highRisk = entities.filter(e => e.riskScore >= 80).length;
    const mediumRisk = entities.filter(e => e.riskScore >= 40 && e.riskScore < 80).length;
    const lowRisk = entities.filter(e => e.riskScore < 40).length;
    return { highRisk, mediumRisk, lowRisk, total: entities.length };
  }, [entities]);

  return (
    <Card className="entity-graph-3d-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="graph-icon">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">3D Entity Network</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Multi-dimensional relationship visualization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Layers className="w-3 h-3" />
              {stats.total} Entities
            </Badge>
            {stats.highRisk > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.highRisk} High Risk
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls Bar */}
        <div className="controls-bar">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="3d">3D View</TabsTrigger>
              <TabsTrigger value="layered">Layered</TabsTrigger>
              <TabsTrigger value="radial">Radial</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="labels" className="text-sm">Labels</Label>
              <Switch
                id="labels"
                checked={showLabels}
                onCheckedChange={setShowLabels}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} aria-label="Zoom in">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} aria-label="Zoom out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setRotation({ x: 15, y: -20 }); setZoom(1); }} aria-label="Reset view">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div
          ref={containerRef}
          className="graph-canvas-3d"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Connections */}
          {connections.map(conn => {
            const sourcePos = nodePositions.get(conn.source);
            const targetPos = nodePositions.get(conn.target);
            if (!sourcePos || !targetPos) return null;

            const isHighlighted = selectedEntity === conn.source || 
                                  selectedEntity === conn.target ||
                                  hoveredEntity === conn.source ||
                                  hoveredEntity === conn.target;

            return (
              <ConnectionLine3D
                key={`${conn.source}-${conn.target}`}
                connection={conn}
                sourcePos={sourcePos}
                targetPos={targetPos}
                isHighlighted={isHighlighted}
              />
            );
          })}

          {/* Nodes */}
          {filteredEntities.map(entity => {
            const pos = nodePositions.get(entity.id);
            if (!pos) return null;

            return (
              <GraphNode3D
                key={entity.id}
                entity={entity}
                position={pos}
                isSelected={selectedEntity === entity.id}
                isHovered={hoveredEntity === entity.id}
                onClick={() => handleEntityClick(entity)}
                onHover={(hover) => setHoveredEntity(hover ? entity.id : null)}
              />
            );
          })}

          {/* Layer indicators */}
          {viewMode === 'layered' && (
            <div className="layer-indicators">
              {[0, 1, 2].map(layer => (
                <div key={layer} className="layer-indicator" style={{ top: 85 + layer * 150 }}>
                  <span>Layer {layer}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="graph-legend">
          <div className="legend-section">
            <span className="legend-title">Risk Level</span>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#ef4444' }} />
                <span>High (80+)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#f59e0b' }} />
                <span>Medium (40-79)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#22c55e' }} />
                <span>Low (&lt;40)</span>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <span className="legend-title">Entity Type</span>
            <div className="legend-items">
              <div className="legend-item">
                <Users className="w-3 h-3" />
                <span>Person</span>
              </div>
              <div className="legend-item">
                <Building className="w-3 h-3" />
                <span>Company</span>
              </div>
              <div className="legend-item">
                <DollarSign className="w-3 h-3" />
                <span>Account</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntityGraph3D;
