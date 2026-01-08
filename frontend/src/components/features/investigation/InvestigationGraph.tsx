import React, { useMemo, useCallback, Suspense } from 'react';
import { Entity, Relationship, GraphNode, GraphLink } from '@/types/investigation';

const ForceGraph2D = React.lazy(() => import('react-force-graph-2d'));

interface InvestigationGraphProps {
  entities: Entity[];
  relationships: Relationship[];
  onNodeClick: (node: Entity) => void;
  onNodeDragEnd: (node: Entity) => void;
}

// eslint-disable-next-line react/display-name
export const InvestigationGraph = React.forwardRef<any, InvestigationGraphProps>(({
  entities,
  relationships,
  onNodeClick,
  onNodeDragEnd
}, ref) => {
  
  const getNodeColor = useCallback((entity: Entity) => {
    if (entity.riskScore && entity.riskScore >= 80) return '#ef4444'; 
    if (entity.riskScore && entity.riskScore >= 60) return '#f97316'; 
    if (entity.riskScore && entity.riskScore >= 40) return '#eab308'; 
    return '#22c55e'; 
  }, []);

  const getLinkColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      'owns': '#3b82f6',
      'transacts_with': '#10b981',
      'located_at': '#8b5cf6',
      'related_to': '#f59e0b',
      'controls': '#ef4444',
      'beneficial_owner': '#ec4899'
    };
    return colors[type] || '#6b7280';
  }, []);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = entities.map(entity => ({
      ...entity,
      val: Math.max(1, (entity.riskScore || 0) / 20),
      color: getNodeColor(entity),
      fx: entity.fx,
      fy: entity.fy
    }));

    const links: GraphLink[] = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type,
      strength: rel.strength,
      color: getLinkColor(rel.type),
      width: Math.max(1, rel.strength / 20)
    }));

    return { nodes, links };
  }, [entities, relationships, getNodeColor, getLinkColor]);

  return (
    <div className="flex-1 relative h-full w-full bg-gray-50">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Graph...</div>}>
        <ForceGraph2D
          ref={ref}
          graphData={graphData}
          nodeLabel={(node: any) => `${node.name} (${node.type})`}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.val}
          linkColor={(link: any) => link.color}
          linkWidth={(link: any) => link.width}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node: any) => {
             const entity = entities.find(e => e.id === node.id);
             if (entity) onNodeClick(entity);
          }}
          onNodeDragEnd={(node: any) => {
             const entity = entities.find(e => e.id === node.id);
             if (entity && node.x !== undefined && node.y !== undefined) {
                 onNodeDragEnd({ ...entity, fx: node.x, fy: node.y });
             }
          }}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </Suspense>
    </div>
  );
});
