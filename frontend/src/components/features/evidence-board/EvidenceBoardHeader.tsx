import React from 'react';
import { LayoutGrid, File, CheckCircle, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EvidenceBoardHeaderProps {
  stats: {
    total: number;
    verified: number;
    flagged: number;
  };
}

export const EvidenceBoardHeader: React.FC<EvidenceBoardHeaderProps> = ({ stats }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 p-2.5 rounded-xl text-white">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Evidence Board</h1>
          <p className="text-sm text-slate-500 font-medium">Collaborative investigation workspace</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-slate-200 bg-white text-slate-600 font-bold">
          <File className="w-3 h-3" />
          {stats.total} Items
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-emerald-100 bg-emerald-50 text-emerald-700 font-bold">
          <CheckCircle className="w-3 h-3" />
          {stats.verified} Verified
        </Badge>
        {stats.flagged > 0 && (
          <Badge variant="destructive" className="gap-1.5 py-1.5 px-3 font-bold">
            <Flag className="w-3 h-3" />
            {stats.flagged} Flagged
          </Badge>
        )}
      </div>
    </div>
  );
};
