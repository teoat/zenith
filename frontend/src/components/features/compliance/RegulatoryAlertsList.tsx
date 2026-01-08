import React from 'react';
import { motion } from 'framer-motion';
import { RegulatoryAlert } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface RegulatoryAlertListProps {
  regulatoryAlerts: RegulatoryAlert[];
  getFrameworkDisplayName: (fw: string) => string;
  getRiskColor: (risk: string) => string;
  onAcknowledge: (alertId: string) => void;
}

export const RegulatoryAlertsList: React.FC<RegulatoryAlertListProps> = ({
  regulatoryAlerts,
  getFrameworkDisplayName,
  getRiskColor,
  onAcknowledge
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Regulatory Alerts</h3>
          <p className="text-slate-600">Critical compliance violations requiring immediate attention.</p>
        </div>

        <div className="space-y-4">
          {regulatoryAlerts.map((alert, index) => (
            <div key={index} className="border-l-4 border-red-500 bg-white shadow-sm rounded-r-lg p-6 border-y border-r border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{alert.title}</h4>
                  <p className="text-sm text-slate-500">{getFrameworkDisplayName(alert.framework)}</p>
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", getRiskColor(alert.severity))}>
                  {alert.severity}
                </span>
              </div>

              <div className="bg-red-50 p-4 rounded-lg mb-4 text-slate-800">
                <p>{alert.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider">Affected Entities</span>
                  <span className="font-medium">{alert.affected_entities.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider">Deadline</span>
                  <span className="font-medium text-red-600">{new Date(alert.deadline).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase tracking-wider">Escalation Level</span>
                  <span className="font-medium">{alert.escalation_level}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <h5 className="text-xs font-bold text-slate-900 uppercase mb-1">Required Action:</h5>
                  <p className="text-sm text-slate-700">{alert.required_action}</p>
                </div>
                <div>
                  {!alert.acknowledged_at && (
                    <button
                      onClick={() => onAcknowledge(alert.alert_id)}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors"
                    >
                      Acknowledge Alert
                    </button>
                  )}
                  {alert.acknowledged_at && !alert.resolved_at && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Acknowledged
                    </span>
                  )}
                  {alert.resolved_at && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {regulatoryAlerts.length === 0 && (
             <p className="text-center text-slate-500 py-8">No active alerts.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
