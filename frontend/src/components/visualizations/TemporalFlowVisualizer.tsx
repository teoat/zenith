/**
 * TemporalFlowVisualizer - Phase 6E Advanced Visualization
 * Real-time transaction flow visualization with temporal playback
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  AlertTriangle,
  TrendingUp,
  Zap,
  Activity
} from 'lucide-react';
import './TemporalFlowVisualizer.css';

// Types
import { api } from '@/lib/api';
import { TransactionFlow } from '@/types/api';

/* Local types replaced by global API types */
interface VisualizerTransaction extends Omit<TransactionFlow, 'timestamp'> {
  timestamp: Date;
}

interface FlowNode {
  id: string;
  label: string;
  type: 'account' | 'merchant' | 'external' | 'flagged';
  balance?: number;
  x: number;
  y: number;
}

interface TemporalFlowVisualizerProps {
  transactions?: TransactionFlow[];
  onTransactionClick?: (tx: TransactionFlow) => void;
  onTimeRangeChange?: (start: Date, end: Date) => void;
  autoPlay?: boolean;
}

// Mock data generator for demonstration
// Mock generator removed in favor of real API

// Flow Animation Component
const FlowAnimation: React.FC<{
  flow: VisualizerTransaction;
  nodes: Map<string, FlowNode>;
  isActive: boolean;
}> = ({ flow, nodes, isActive }) => {
  const sourceNode = nodes.get(flow.source);
  const targetNode = nodes.get(flow.target);
  
  if (!sourceNode || !targetNode) return null;

  const getFlowColor = (type: TransactionFlow['type']) => {
    switch (type) {
      case 'flagged': return '#ef4444';
      case 'suspicious': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <g className={`flow-path ${isActive ? 'flow-active' : 'flow-inactive'}`}>
      <line
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke={getFlowColor(flow.type)}
        strokeWidth={isActive ? 3 : 1}
        strokeOpacity={isActive ? 0.8 : 0.2}
        markerEnd="url(#arrowhead)"
      />
      {isActive && (
        <circle className="flow-particle" r={4} fill={getFlowColor(flow.type)}>
          <animateMotion
            dur="1s"
            repeatCount="indefinite"
            path={`M${sourceNode.x},${sourceNode.y} L${targetNode.x},${targetNode.y}`}
          />
        </circle>
      )}
    </g>
  );
};

export const TemporalFlowVisualizer: React.FC<TemporalFlowVisualizerProps> = ({
  transactions: propTransactions,
  onTransactionClick: _onTransactionClick,
  onTimeRangeChange: _onTimeRangeChange,
  autoPlay = false
}) => {
  const [transactions, setTransactions] = useState<VisualizerTransaction[]>(() => 
    propTransactions 
      ? propTransactions.map(t => ({ ...t, timestamp: new Date(t.timestamp) }))
      : []
  );
  const [isLoading, setIsLoading] = useState(!propTransactions);

  useEffect(() => {
    if (!propTransactions) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const rawData = await api.getTemporalFlow(30);
          // Convert timestamp string to Date objects
          const processedData = rawData.map(tx => ({
            ...tx,
            timestamp: new Date(tx.timestamp)
          }));
          setTransactions(processedData);
        } catch (err) {
          console.error("Failed to fetch temporal flow data:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [propTransactions]);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [timeRange, _setTimeRange] = useState<[number, number]>([0, 100]);
  const [selectedTx, _setSelectedTx] = useState<VisualizerTransaction | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Generate node positions
  const nodes = React.useMemo(() => {
    if (isLoading) return new Map<string, FlowNode>();
    const nodeMap = new Map<string, FlowNode>();
    const uniqueNodes = new Set<string>();
    
    transactions.forEach(tx => {
      uniqueNodes.add(tx.source);
      uniqueNodes.add(tx.target);
    });

    const nodeArray = Array.from(uniqueNodes);
    const centerX = 350;
    const centerY = 200;
    const radius = 150;
    
    nodeArray.forEach((nodeName, index) => {
      const angle = (index / nodeArray.length) * 2 * Math.PI - Math.PI / 2;
      nodeMap.set(nodeName, {
        id: nodeName,
        label: nodeName,
        type: nodeName.includes('External') ? 'external' : 
              nodeName.includes('Merchant') ? 'merchant' : 'account',
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
    
    return nodeMap;
  }, [transactions]);

  // Filter visible transactions based on time
  const visibleTransactions = React.useMemo(() => {
    if (transactions.length === 0) return [];
    
    const startIdx = Math.floor((timeRange[0] / 100) * transactions.length);
    const endIdx = Math.ceil((timeRange[1] / 100) * transactions.length);
    const currentIdx = Math.floor((currentTime / 100) * (endIdx - startIdx)) + startIdx;
    
    return transactions.slice(startIdx, currentIdx + 1);
  }, [transactions, timeRange, currentTime]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = visibleTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const suspicious = visibleTransactions.filter(tx => tx.type === 'suspicious').length;
    const flagged = visibleTransactions.filter(tx => tx.type === 'flagged').length;
    
    return { total, suspicious, flagged, count: visibleTransactions.length };
  }, [visibleTransactions]);

  // Playback animation
  useEffect(() => {
    if (isPlaying) {
      const speed = parseFloat(playbackSpeed.replace('x', ''));
      const step = () => {
        setCurrentTime(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + (0.5 * speed);
        });
        animationRef.current = requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Removed unused _handleTransactionClick to fix lint warnings

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getNodeColor = (type: FlowNode['type']) => {
    switch (type) {
      case 'flagged': return '#ef4444';
      case 'external': return '#8b5cf6';
      case 'merchant': return '#3b82f6';
      default: return '#10b981';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading temporal data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="temporal-flow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="temporal-icon">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Temporal Flow Analysis</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Real-time transaction flow visualization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              {stats.count} Transactions
            </Badge>
            {stats.flagged > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.flagged} Flagged
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          <div className="stat-card">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="font-semibold">{formatCurrency(stats.total)}</p>
            </div>
          </div>
          <div className="stat-card">
            <Activity className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="font-semibold">{stats.count}</p>
            </div>
          </div>
          <div className="stat-card">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Suspicious</p>
              <p className="font-semibold">{stats.suspicious}</p>
            </div>
          </div>
          <div className="stat-card">
            <Zap className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Flagged</p>
              <p className="font-semibold">{stats.flagged}</p>
            </div>
          </div>
        </div>

        {/* Flow Visualization */}
        <div className="flow-canvas-container" role="img" aria-label="Transaction flow diagram showing movement of funds between accounts over time">
          <svg ref={canvasRef} className="flow-canvas" viewBox="0 0 700 400" aria-hidden="true">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Flow paths */}
            {transactions.slice(0, visibleTransactions.length).map((tx, idx) => (
              <FlowAnimation
                key={tx.id}
                flow={tx}
                nodes={nodes}
                isActive={idx === visibleTransactions.length - 1}
              />
            ))}
            
            {/* Nodes */}
            {Array.from(nodes.values()).map(node => (
              <g key={node.id} className="flow-node" filter="url(#glow)">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={20}
                  fill={getNodeColor(node.type)}
                  opacity={0.9}
                />
                <text
                  x={node.x}
                  y={node.y + 35}
                  textAnchor="middle"
                  className="node-label"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Screen Reader Only Data Table */}
        <div className="sr-only">
          <h3>Transaction Details</h3>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Target</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, visibleTransactions.length).map(tx => (
                <tr key={tx.id}>
                  <td>{tx.source}</td>
                  <td>{tx.target}</td>
                  <td>{formatCurrency(tx.amount)}</td>
                  <td>{tx.type}</td>
                  <td>{tx.timestamp.toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Playback Controls */}
        <div className="playback-controls">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(0)}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? 'secondary' : 'default'}
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(100)}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5x">0.5x</SelectItem>
                <SelectItem value="1x">1x</SelectItem>
                <SelectItem value="2x">2x</SelectItem>
                <SelectItem value="4x">4x</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 mx-4">
            <Slider
              value={[currentTime]}
              onValueChange={([val]: number[]) => setCurrentTime(val)}
              max={100}
              step={1}
              className="timeline-slider"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{Math.round(currentTime)}%</span>
          </div>
        </div>

        {/* Selected Transaction Details */}
        {selectedTx && (
          <div className="selected-tx-panel">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{selectedTx.source} → {selectedTx.target}</p>
                <p className="text-sm text-muted-foreground">{selectedTx.category}</p>
              </div>
              <Badge variant={selectedTx.type === 'flagged' ? 'destructive' : 
                             selectedTx.type === 'suspicious' ? 'secondary' : 'default'}>
                {selectedTx.type}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold">{formatCurrency(selectedTx.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-semibold">{selectedTx.timestamp.toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="font-semibold">{selectedTx.riskScore || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemporalFlowVisualizer;
