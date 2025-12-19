import React, { useState } from 'react';
import { Lightbulb, Check, X, Plus, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import type { EvidenceItem } from '../../lib/api';
import { AccessibleButton } from '../ui/AccessibleButton';

interface Hypothesis {
  id: string;
  title: string;
  description: string;
  status: 'PROVEN' | 'DISPROVEN' | 'TESTING';
  supportCount: number;
  refuteCount: number;
}

interface HypothesisBoardProps {
  evidence?: EvidenceItem[];
}

export const HypothesisBoard: React.FC<HypothesisBoardProps> = () => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([
    {
      id: 'h1',
      title: 'Insider Collusion',
      description: 'The admin user manually overrode the risk controls to allow the transaction.',
      status: 'TESTING',
      supportCount: 2,
      refuteCount: 0
    },
    {
      id: 'h2',
      title: 'Credential Compromise',
      description: 'The account was accessed via phishing, suggested by external IP address.',
      status: 'DISPROVEN',
      supportCount: 1,
      refuteCount: 3
    }
  ]);

  const addHypothesis = () => {
      // Logic for adding new hypothesis would go here
      const newH: Hypothesis = {
          id: `h${Date.now()}`,
          title: 'New Theory',
          description: 'Click to edit description...',
          status: 'TESTING',
          supportCount: 0,
          refuteCount: 0
      };
      setHypotheses([...hypotheses, newH]);
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Lightbulb className="text-amber-500" />
              Hypothesis Testing
            </h2>
            <p className="text-slate-500 text-sm">Collaborative theory validation and peer review</p>
          </div>
          <AccessibleButton onClick={addHypothesis} className="bg-blue-600 text-white">
            <Plus size={16} className="mr-2" />
            New Hypothesis
          </AccessibleButton>
        </div>

        {/* Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* Column 1: Testing */}
           <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                     Testing
                  </h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                     {hypotheses.filter(h => h.status === 'TESTING').length}
                  </span>
              </div>
              
              {hypotheses.filter(h => h.status === 'TESTING').map(h => (
                  <HypothesisCard key={h.id} hypothesis={h} />
              ))}
           </div>

           {/* Column 2: Proven */}
           <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                     <Check size={16} />
                     Proven
                  </h3>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full text-emerald-700">
                     {hypotheses.filter(h => h.status === 'PROVEN').length}
                  </span>
              </div>
              {hypotheses.filter(h => h.status === 'PROVEN').map(h => (
                  <HypothesisCard key={h.id} hypothesis={h} />
              ))}
           </div>

           {/* Column 3: Disproven */}
           <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                     <X size={16} />
                     Disproven
                  </h3>
                  <span className="text-xs bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full text-rose-700">
                     {hypotheses.filter(h => h.status === 'DISPROVEN').length}
                  </span>
              </div>
              {hypotheses.filter(h => h.status === 'DISPROVEN').map(h => (
                  <HypothesisCard key={h.id} hypothesis={h} />
              ))}
           </div>

        </div>
      </div>
    </div>
  );
};

const HypothesisCard: React.FC<{ hypothesis: Hypothesis }> = ({ hypothesis }) => {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{hypothesis.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{hypothesis.description}</p>
                
                <div className="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <ThumbsUp size={14} /> {hypothesis.supportCount}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                            <ThumbsDown size={14} /> {hypothesis.refuteCount}
                        </span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 hover:text-blue-500 cursor-pointer">
                        <MessageSquare size={16} />
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
