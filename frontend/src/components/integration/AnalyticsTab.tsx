import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Activity, Clock } from 'lucide-react';
import type { Integration } from '../../lib/api';

interface AnalyticsTabProps {
  integrations: Integration[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ integrations }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="analytics-dashboard">
        <h3 className="text-lg font-semibold mb-6">Integration Analytics</h3>

        <div className="analytics-charts">
          <div className="chart-card">
            <h4 className="chart-title">Request Volume by Integration</h4>
            <div className="chart-placeholder">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-center">Request volume chart would be displayed here</p>
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Success Rate Trends</h4>
            <div className="chart-placeholder">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-center">Success rate trends would be displayed here</p>
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Latency Distribution</h4>
            <div className="chart-placeholder">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-center">Latency distribution would be displayed here</p>
            </div>
          </div>
        </div>

        <div className="analytics-table">
          <h4 className="text-md font-semibold mb-4">Integration Performance</h4>
          <div className="table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Integration</th>
                  <th>Requests</th>
                  <th>Success Rate</th>
                  <th>Avg Latency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td className="font-medium">{integration.name}</td>
                    <td>{integration.requestCount.toLocaleString()}</td>
                    <td>
                      <span className={`success-rate ${(integration.successRate * 100) >= 95 ? 'high' : (integration.successRate * 100) >= 90 ? 'medium' : 'low'}`}>
                        {(integration.successRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>245ms</td>
                    <td>
                      <span className={`status-badge status-${integration.status}`}>
                        {integration.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
