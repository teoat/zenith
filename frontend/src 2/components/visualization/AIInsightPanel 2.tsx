import React, { useMemo } from 'react';
import { useAIContext } from '../../context/AIContext';
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface AIInsightPanelProps {
  type: 'alert_analysis' | 'graph' | 'general';
  data: unknown;
  persona?: string;
  className?: string;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ type: _type, data, persona, className }) => {
  const { activePersona } = useAIContext();
  const currentPersona = persona || activePersona;

  // Mock analysis logic based on persona
  const analysis = useMemo(() => {
    switch (currentPersona) {
        case 'legal':
            return {
                title: "Legal Risk Assessment",
                points: ["Compliance check required for transaction #8839", "Evidence chain of custody verified", "Regulatory filing recommended"],
                risk: "Medium"
            };
        case 'forensic':
            return {
                title: "Forensic Analysis",
                points: ["Structuring pattern detected (p=0.89)", "Benford's Law deviation present", "Mirror transaction identified"],
                risk: "High"
            };
        case 'investigator':
            return {
                title: "Investigation Leads",
                points: ["Subject linked to known shell entity", "Velocity anomalies in last 24h", "Recommend interview with counterparty"],
                risk: "Critical"
            };
        default:
            return {
                title: "Frenly's Insights",
                points: ["Unusual activity detected", "Pattern matches 3 previous cases", "Review suggested"],
                risk: "Medium"
            };
    }
  }, [currentPersona, data]);

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm ${className}`}>
       <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
             <Brain size={18} />
          </div>
          <div>
             <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{analysis.title}</h4>
             <p className="text-xs text-slate-500">Persona: {currentPersona}</p>
          </div>
          <div className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${
              analysis.risk === 'Critical' ? 'bg-red-100 text-red-700' : 
              analysis.risk === 'High' ? 'bg-orange-100 text-orange-700' : 
              'bg-blue-100 text-blue-700'
          }`}>
              {analysis.risk} Risk
          </div>
       </div>

       <div className="space-y-3">
          {analysis.points.map((point, i) => (
              <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="mt-0.5 flex-shrink-0">
                      {i === 0 ? <AlertTriangle size={14} className="text-amber-500" /> : 
                       i === 1 ? <TrendingUp size={14} className="text-blue-500" /> :
                       <Lightbulb size={14} className="text-purple-500" />}
                  </div>
                  <p>{point}</p>
              </div>
          ))}
       </div>

       <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
             View Detailed Analysis <span aria-hidden="true">&rarr;</span>
          </button>
       </div>
    </div>
  );
};
