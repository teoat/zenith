import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { FailurePrediction } from '@/types/predictive-maintenance';
import { cn } from '@/lib/utils';

interface FailurePredictionsListProps {
  predictions: FailurePrediction[];
  getProbabilityColor: (prob: number) => string;
}

export const FailurePredictionsList: React.FC<FailurePredictionsListProps> = ({
  predictions,
  getProbabilityColor
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Failure Predictions</h3>
        <p className="text-sm text-slate-600 mb-6">
          Predicted system failures based on current metrics and historical patterns.
        </p>

        <div className="space-y-6">
          {predictions.map((prediction, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-slate-900">
                    {prediction.failure_mode.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-xl font-bold",
                    getProbabilityColor(prediction.probability)
                  )}>
                    {(prediction.probability * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Probability</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-5">
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Time to Failure:</span>
                    <span className="font-medium text-slate-900">{prediction.time_to_failure_hours.toFixed(1)} hours</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-600">Confidence:</span>
                    <span className="font-medium text-slate-900">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="font-semibold text-slate-700 mb-1 text-xs uppercase">Predicted Impact:</h5>
                  <p className="text-slate-600">{prediction.predicted_impact}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h5 className="font-semibold text-slate-700 mb-2 text-xs uppercase">Contributing Factors:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {prediction.contributing_factors.map((factor, factorIndex) => (
                      <li key={factorIndex}>{factor}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-slate-700 mb-2 text-xs uppercase">Recommended Actions:</h5>
                  <div className="flex flex-wrap gap-2">
                    {prediction.recommended_actions.map((action, actionIndex) => (
                      <span key={actionIndex} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                        {action.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
