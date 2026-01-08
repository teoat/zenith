import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface GraphHeaderProps {
  loading: boolean;
  onBuild: (days: number) => void;
}

export const GraphHeader: React.FC<GraphHeaderProps> = ({ loading, onBuild }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
          Relationship Graph
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Visualize and analyze entity connections
        </p>
      </div>
      <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <Button onClick={() => onBuild(30)} disabled={loading} variant="default" className="whitespace-nowrap">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Build (30d)
        </Button>
        <Button onClick={() => onBuild(90)} disabled={loading} variant="outline" className="whitespace-nowrap">
          Build (90d)
        </Button>
      </div>
    </div>
  );
};
