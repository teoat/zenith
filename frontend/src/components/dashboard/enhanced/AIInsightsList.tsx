import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react';
import { AIInsight } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface AIInsightsListProps {
  insights: AIInsight[];
}

export const AIInsightsList: React.FC<AIInsightsListProps> = ({ insights }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {insights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "rounded-lg p-6 border",
            insight.impact === 'high' ? 'border-red-200 bg-red-50' :
            insight.impact === 'medium' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          )}
        >
          <div className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              insight.impact === 'high' ? 'bg-red-100' :
              insight.impact === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
            )}>
              {insight.impact === 'high' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : insight.impact === 'medium' ? (
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">{insight.title}</h3>
              <p className="text-slate-700 text-sm mb-3">{insight.description}</p>
              <div className="flex items-center space-x-4 mb-3">
                <span className="text-xs text-slate-500">
                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                </span>
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                  insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                )}>
                  {insight.impact.toUpperCase()} IMPACT
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Recommended Actions:</h4>
                <ul className="space-y-1">
                  {insight.actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                      <ChevronRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
