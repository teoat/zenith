import React, { useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useResizeObserver } from '@/hooks/useResizeObserver';

interface GraphNode {
  id: string;
  group?: number;
  val?: number;
  [key: string]: any;
}

interface GraphLink {
  source: string;
  target: string;
  [key: string]: any;
}

interface EntityGraph3DWebGLProps {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

const EntityGraph3DWebGL: React.FC<EntityGraph3DWebGLProps> = ({
  data,
  onNodeClick,
  width,
  height,
}) => {
  const fgRef = useRef<any>();

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      if (fgRef.current) {
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
          node, // lookAt ({ x, y, z })
          3000 // ms transition duration
        );
      }
      
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full">
         <ForceGraph3D
            ref={fgRef}
            graphData={data}
            nodeLabel="id"
            nodeAutoColorBy="group"
            onNodeClick={handleNodeClick}
            width={width}
            height={height}
            backgroundColor="#00000000" // Transparent
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            // Optimization: Level of Detail
            nodeResolution={8} 
            linkResolution={6}
          />
    </div>
  );
};

export default EntityGraph3DWebGL;
