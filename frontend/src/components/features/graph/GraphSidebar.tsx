import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, AlertTriangle } from 'lucide-react';
import { CanvasNode } from '@/types/graph';
import { CentralEntity, SuspiciousPattern } from '@/types/api';

interface GraphSidebarProps {
  selectedNode: CanvasNode | null;
  centralEntities: CentralEntity[];
  suspiciousPatterns: SuspiciousPattern[];
  onDetectCommunities: () => void;
  onDetectCentrality: () => void;
  onDetectPatterns: () => void;
  onSelectEntity: (id: string) => void;
}

export const GraphSidebar: React.FC<GraphSidebarProps> = ({
  selectedNode,
  centralEntities,
  suspiciousPatterns,
  onDetectCommunities,
  onDetectCentrality,
  onDetectPatterns,
  onSelectEntity
}) => {
  return (
    <div className="space-y-6">
      {/* Analysis Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={onDetectCommunities} className="w-full justify-start" variant="outline">
            <Users className="w-4 h-4 mr-2 text-indigo-500" />
            Detect Communities
          </Button>
          <Button onClick={onDetectCentrality} className="w-full justify-start" variant="outline">
            <Search className="w-4 h-4 mr-2 text-blue-500" />
            Central Entities
          </Button>
          <Button onClick={onDetectPatterns} className="w-full justify-start" variant="outline">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
            Suspicious Patterns
          </Button>
        </CardContent>
      </Card>

      {/* Selected Entity */}
      {selectedNode && (
        <Card className="animate-in slide-in-from-bottom-2">
          <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg">Selected Entity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Label</span>
                <span className="font-medium truncate max-w-[150px]" title={selectedNode.label}>{selectedNode.label}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Type</span>
                <Badge variant="secondary" className="capitalize">{selectedNode.type}</Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Transactions</span>
                <span className="font-mono">{selectedNode.transaction_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Volume</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  ${(selectedNode.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Central Entities */}
      {centralEntities.length > 0 && (
        <Card className="max-h-[300px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Central Entities</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-2">
              {centralEntities.map((entity) => (
                <button
                  key={entity.id}
                  className="w-full text-left text-sm p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  onClick={() => onSelectEntity(entity.id)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{entity.name}</span>
                    <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                      {entity.centrality.toFixed(3)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {entity.connections} connections • {entity.type}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {suspiciousPatterns.length > 0 && (
        <Card className="max-h-[300px] flex flex-col border-red-200 dark:border-red-900/30">
          <CardHeader className="pb-2 bg-red-50/50 dark:bg-red-900/10">
            <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="space-y-3 pt-2">
              {suspiciousPatterns.map((pattern) => (
                <div key={pattern.id} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                  <div className="font-bold text-red-700 dark:text-red-300 capitalize text-xs">
                    {pattern.patternType.replace(/_/g, ' ')}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                    {pattern.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
