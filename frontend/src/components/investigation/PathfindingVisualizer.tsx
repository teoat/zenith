import React, { useState, useCallback } from "react";
import { MapPin, Navigation, Pause, Play, RotateCcw, Zap } from "lucide-react";

interface PathNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface PathEdge {
  source: string;
  target: string;
  weight: number;
}

// Mock graph for demo
const MOCK_NODES: PathNode[] = [
  { id: "A", label: "John Doe", x: 50, y: 150 },
  { id: "B", label: "Shell Corp", x: 200, y: 50 },
  { id: "C", label: "Offshore Bank", x: 200, y: 250 },
  { id: "D", label: "Jane Smith", x: 350, y: 100 },
  { id: "E", label: "Real Estate LLC", x: 350, y: 200 },
  { id: "F", label: "Cayman Trust", x: 500, y: 150 },
];

const MOCK_EDGES: PathEdge[] = [
  { source: "A", target: "B", weight: 2 },
  { source: "A", target: "C", weight: 4 },
  { source: "B", target: "D", weight: 1 },
  { source: "B", target: "E", weight: 3 },
  { source: "C", target: "E", weight: 2 },
  { source: "D", target: "F", weight: 2 },
  { source: "E", target: "F", weight: 1 },
];

const PathfindingVisualizer: React.FC = () => {
  const [startNode, setStartNode] = useState<string>("A");
  const [endNode, setEndNode] = useState<string>("F");
  const [isRunning, setIsRunning] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [pathNodes, setPathNodes] = useState<string[]>([]);
  const [_currentStep, setCurrentStep] = useState(0);

  // Simple BFS for shortest path
  const findPath = useCallback(() => {
    const queue: { node: string; path: string[] }[] = [
      { node: startNode, path: [startNode] },
    ];
    const visited = new Set<string>();
    const steps: { visited: Set<string>; path: string[] }[] = [];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (visited.has(node)) continue;
      visited.add(node);

      steps.push({ visited: new Set(visited), path: [...path] });

      if (node === endNode) {
        return steps;
      }

      const neighbors = MOCK_EDGES.filter(
        (e) => e.source === node || e.target === node,
      )
        .map((e) => (e.source === node ? e.target : e.source))
        .filter((n) => !visited.has(n));

      for (const neighbor of neighbors) {
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }

    return steps;
  }, [startNode, endNode]);

  const runVisualization = async () => {
    setIsRunning(true);
    setVisitedNodes(new Set());
    setPathNodes([]);
    setCurrentStep(0);

    const steps = findPath();

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setVisitedNodes(steps[i].visited);
      setPathNodes(steps[i].path);
      setCurrentStep(i + 1);
    }

    setIsRunning(false);
  };

  const reset = () => {
    setVisitedNodes(new Set());
    setPathNodes([]);
    setCurrentStep(0);
    setIsRunning(false);
  };

  const isOnPath = (nodeId: string) => pathNodes.includes(nodeId);
  const isVisited = (nodeId: string) => visitedNodes.has(nodeId);

  const isEdgeOnPath = (edge: PathEdge) => {
    const idx1 = pathNodes.indexOf(edge.source);
    const idx2 = pathNodes.indexOf(edge.target);
    return idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-green-500" />
          <select
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            disabled={isRunning}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
            aria-label="Select start node"
          >
            {MOCK_NODES.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        <Navigation size={16} className="text-slate-400" />

        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-red-500" />
          <select
            value={endNode}
            onChange={(e) => setEndNode(e.target.value)}
            disabled={isRunning}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
            aria-label="Select end node"
          >
            {MOCK_NODES.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        <button
          onClick={runVisualization}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? "Running..." : "Find Path"}
        </button>

        <button
          onClick={reset}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Reset visualization"
        >
          <RotateCcw size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Graph Canvas */}
      <div className="relative h-80 bg-slate-50 dark:bg-slate-950">
        <svg className="w-full h-full">
          {/* Edges */}
          {MOCK_EDGES.map((edge, i) => {
            const source = MOCK_NODES.find((n) => n.id === edge.source)!;
            const target = MOCK_NODES.find((n) => n.id === edge.target)!;
            const onPath = isEdgeOnPath(edge);

            return (
              <g key={i}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={onPath ? "#3b82f6" : "#e2e8f0"}
                  strokeWidth={onPath ? 3 : 1.5}
                  className="transition-all duration-300"
                />
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400"
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {MOCK_NODES.map((node) => {
            const onPath = isOnPath(node.id);
            const visited = isVisited(node.id);
            const isStart = node.id === startNode;
            const isEnd = node.id === endNode;

            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={onPath ? 24 : 20}
                  fill={
                    isStart
                      ? "#22c55e"
                      : isEnd
                        ? "#ef4444"
                        : onPath
                          ? "#3b82f6"
                          : visited
                            ? "#f59e0b"
                            : "#fff"
                  }
                  stroke={onPath ? "#1d4ed8" : "#e2e8f0"}
                  strokeWidth={2}
                  className="transition-all duration-300"
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className={`text-xs font-bold ${onPath || isStart || isEnd ? "fill-white" : "fill-slate-700"}`}
                >
                  {node.id}
                </text>
                <text
                  x={node.x}
                  y={node.y + 36}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full" /> Visited:{" "}
            {visitedNodes.size}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full" /> Path:{" "}
            {pathNodes.length}
          </span>
        </div>
        {pathNodes.length > 0 && (
          <div className="flex items-center gap-2 text-blue-600">
            <Zap size={14} />
            {pathNodes.join(" → ")}
          </div>
        )}
      </div>
    </div>
  );
};

export default PathfindingVisualizer;
