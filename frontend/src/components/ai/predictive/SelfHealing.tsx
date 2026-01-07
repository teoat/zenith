import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import type { SelfHealingAction } from '@/components/ai/types/predictive';

interface SelfHealingProps {
  healingActions: SelfHealingAction[];
}

export const SelfHealing: React.FC<SelfHealingProps> = ({ healingActions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="self-healing">
        <h3 className="section-title">Self-Healing Actions</h3>
        <p className="section-description">
          Automated recovery actions triggered by AI predictions and system monitoring.
        </p>

        <div className="healing-actions-list">
          {healingActions.map((action, index) => (
            <div key={index} className="healing-card">
              <div className="healing-header">
                <div className="healing-type">
                  <Wrench className="w-5 h-5 text-blue-500" />
                  <span className="action-type">
                    {action.action_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="healing-status">
                  {action.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="status-text">
                    {action.success ? 'Successful' : 'Failed'}
                  </span>
                </div>
              </div>

              <div className="healing-details">
                <div className="healing-info">
                  <div className="info-row">
                    <span className="info-label">Target Service:</span>
                    <span className="info-value">{action.target_service}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Executed:</span>
                    <span className="info-value">
                      {new Date(action.execution_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Rollback Available:</span>
                    <span className="info-value">
                      {action.rollback_available ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="healing-trigger">
                  <h5 className="trigger-title">Trigger Condition:</h5>
                  <p className="trigger-description">{action.trigger_condition}</p>
                </div>

                <div className="healing-impact">
                  <h5 className="impact-title">Impact Assessment:</h5>
                  <p className="impact-description">{action.impact_assessment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
