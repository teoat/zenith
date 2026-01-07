import React, { useState } from 'react';
import { Brain, Scale, Target, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { EvidenceItem } from '@/lib/api';

interface IntentIndicator {
  id: string;
  type: 'KNOWLEDGE' | 'INTENT' | 'MOTIVE';
  description: string;
  confidence: number; // 0-100
  evidenceIds: string[];
}

interface MensReaAnalyzerProps {
  evidence?: EvidenceItem[];
}

export const MensReaAnalyzer: React.FC<MensReaAnalyzerProps> = ({ evidence: _evidence = [] }) => {
  const [activeTab, setActiveTab] = useState<'INTENT' | 'KNOWLEDGE' | 'MOTIVE'>('INTENT');

  // Mock initial analysis data
  const [indicators] = useState<IntentIndicator[]>([
    {
      id: '1',
      type: 'KNOWLEDGE',
      description: 'Subject accessed sensitive admin panel 3 times prior to incident',
      confidence: 85,
      evidenceIds: ['log_123']
    },
    {
      id: '2',
      type: 'INTENT',
      description: 'Structured transactions below reporting threshold ($9,900)',
      confidence: 92,
      evidenceIds: ['tx_456', 'tx_457']
    },
    {
      id: '3',
      type: 'MOTIVE',
      description: 'High personal debt detected in background check',
      confidence: 60,
      evidenceIds: ['credit_report_001']
    }
  ]);

  const getIndicatorsByType = (type: string) => indicators.filter(i => i.type === type);

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Brain className="text-purple-600" />
              Mens Rea Analysis
            </h2>
            <p className="text-slate-500 text-sm">Automated intent pattern recognition and legal element mapping</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
               Establish Legal Intent
            </span>
          </div>
        </div>

        {/* Legal Elements Tabs */}
        <div className="grid grid-cols-3 gap-4">
           {[
             { id: 'KNOWLEDGE', icon: <Target size={20} />, label: 'Knowledge', desc: 'Awareness of Facts' },
             { id: 'INTENT', icon: <ArrowRight size={20} />, label: 'Intent', desc: 'Purpose to Commit' },
             { id: 'MOTIVE', icon: <Scale size={20} />, label: 'Motive', desc: 'Reason for Action' }
           ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'INTENT' | 'KNOWLEDGE' | 'MOTIVE')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 ${
                  activeTab === tab.id 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-purple-300'
                }`}
             >
                {tab.icon}
                <div>
                   <div className="font-bold text-sm">{tab.label}</div>
                   <div className="text-xs opacity-75">{tab.desc}</div>
                </div>
             </button>
           ))}
        </div>

        {/* Analysis Content */}
        <div className="space-y-4">
           {getIndicatorsByType(activeTab).map(indicator => (
             <Card key={indicator.id} className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-start">
                     <CardTitle className="text-base font-medium text-slate-800 dark:text-slate-200">
                        {indicator.description}
                     </CardTitle>
                     <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                            indicator.confidence > 80 ? 'bg-green-100 text-green-700' : 
                            indicator.confidence > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {indicator.confidence}% Confidence
                        </span>
                     </div>
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-col gap-2">
                      <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Supporting Evidence</div>
                      <div className="flex gap-2 flex-wrap">
                         {indicator.evidenceIds.map(eid => (
                            <div key={eid} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                               <CheckCircle2 size={12} className="text-green-500" />
                               {eid}
                            </div>
                         ))}
                         {indicator.evidenceIds.length === 0 && (
                            <div className="flex items-center gap-1 text-amber-500 text-xs">
                               <AlertCircle size={12} /> No mapped evidence
                            </div>
                         )}
                      </div>
                   </div>
                </CardContent>
             </Card>
           ))}

           {getIndicatorsByType(activeTab).length === 0 && (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                 <p>No indicators detected for {activeTab.toLowerCase()}.</p>
                 <button className="mt-4 text-purple-600 hover:underline text-sm font-medium">
                    Run Advanced AI Scan
                 </button>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};
