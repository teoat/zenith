import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { FailurePrediction } from '@/components/ai/types/predictive';

interface FailurePredictionsProps {
  predictions: FailurePrediction[];
}

export const FailurePredictions: React.FC<FailurePredictionsProps> = ({ predictions }) => {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600';
    if (probability >= 0.5) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="predictions-section">
        <h3 className="section-title">AI Failure Predictions</h3>
        <p className="section-description">
          Predicted system failures based on current metrics and historical patterns.
        </p>

        <div className="predictions-list">
          {predictions.map((prediction, index) => (
            <div key={index} className="prediction-card">
              <div className="prediction-header">
                <div className="prediction-type">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="prediction-mode">
                    {prediction.failure_mode.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="prediction-probability">
                  <span className={`probability-value ${getProbabilityColor(prediction.probability)}`}>
                    {(prediction.probability * 100).toFixed(0)}%
                  </span>
                  <span className="probability-label">Probability</span>
                </div>
              </div>

              <div className="prediction-details">
                <div className="prediction-metrics">
                  <div className="metric">
                    <span className="metric-label">Time to Failure:</span>
                    <span className="metric-value">{prediction.time_to_failure_hours.toFixed(1)} hours</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Confidence:</span>
                    <span className="metric-value">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="prediction-impact">
                  <h5 className="impact-title">Predicted Impact:</h5>
                  <p className="impact-description">{prediction.predicted_impact}</p>
                </div>

                <div className="prediction-factors">
                  <h5 className="factors-title">Contributing Factors:</h5>
                  <ul className="factors-list">
                    {prediction.contributing_factors.map((factor, factorIndex) => (
                      <li key={factorIndex} className="factor-item">{factor}</li>
                    ))}
                  </ul>
                </div>

                <div className="prediction-actions">
                  <h5 className="actions-title">Recommended Actions:</h5>
                  <div className="actions-list">
                    {prediction.recommended_actions.map((action, actionIndex) => (
                      <span key={actionIndex} className="action-tag">
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
