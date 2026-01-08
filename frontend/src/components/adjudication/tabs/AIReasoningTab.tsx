import React from 'react';
import { AlertItem } from '../../../lib/api';
import { ShieldAlert } from 'lucide-react';

interface AIReasoningTabProps {
  alert: AlertItem;
}

const AIReasoningTab: React.FC<AIReasoningTabProps> = ({ alert }) => {
  // Mock reasoning if not present in alert object
  const reasoning = alert.ai_reasoning || {
    summary: "This transaction deviates significantly from the established pattern for this entity.",
    confidence: 0.87,
    indicators: [
      { type: "amount_anomaly", score: 0.92, desc: "Amount is 3x higher than 30-day average" },
      { type: "velocity_risk", score: 0.78, desc: "2nd transaction in 10 minutes" },
      { type: "geo_risk", score: 0.45, desc: "IP address from high-risk jurisdiction" }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
           AI Analysis
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
          {reasoning.summary}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Risk Indicators</h4>
        <div className="space-y-3">
          {reasoning.indicators.map((ind, i) => (
             <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                <div className={`mt-1 ${ind.score > 0.8 ? 'text-red-500' : ind.score > 0.5 ? 'text-amber-500' : 'text-blue-500'}`}>
                   <ShieldAlert size={16} />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300 capitalize">
                        {ind.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono font-bold">{Math.round(ind.score * 100)}%</span>
                   </div>
                   <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1">
                      <div 
                        className={`h-full rounded-full ${ind.score > 0.8 ? 'bg-red-500' : ind.score > 0.5 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                        style={{ width: `${ind.score * 100}%` }}
                      ></div>
                   </div>
                   <p className="text-xs text-slate-500">{ind.desc}</p>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIReasoningTab;
