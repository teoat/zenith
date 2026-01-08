import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Webhook, Globe, Database } from 'lucide-react';

export const IntegrationOverview: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      {/* Integration Health Status */}
      <div className="health-status-grid">
        <div className="status-card">
          <h3 className="status-title">API Gateway</h3>
          <div className="status-indicator status-healthy">
            <CheckCircle className="w-4 h-4" />
            <span>Operational</span>
          </div>
          <p className="status-description">Federated API requests routing normally</p>
        </div>

        <div className="status-card">
          <h3 className="status-title">Event Bus</h3>
          <div className="status-indicator status-healthy">
            <CheckCircle className="w-4 h-4" />
            <span>Active</span>
          </div>
          <p className="status-description">Real-time event processing operational</p>
        </div>

        <div className="status-card">
          <h3 className="status-title">Webhook Handler</h3>
          <div className="status-indicator status-healthy">
            <CheckCircle className="w-4 h-4" />
            <span>Processing</span>
          </div>
          <p className="status-description">Inbound webhooks being processed</p>
        </div>

        <div className="status-card">
          <h3 className="status-title">Circuit Breaker</h3>
          <div className="status-indicator status-healthy">
            <CheckCircle className="w-4 h-4" />
            <span>Stable</span>
          </div>
          <p className="status-description">No integration failures detected</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3 className="text-lg font-semibold mb-4">Recent Integration Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <Webhook className="w-4 h-4 text-blue-500" />
            </div>
            <div className="activity-content">
              <p className="activity-text">Credit Bureau webhook processed successfully</p>
              <p className="activity-time">2 minutes ago</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Globe className="w-4 h-4 text-green-500" />
            </div>
            <div className="activity-content">
              <p className="activity-text">Bank API integration synced 150 transactions</p>
              <p className="activity-time">5 minutes ago</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Database className="w-4 h-4 text-orange-500" />
            </div>
            <div className="activity-content">
              <p className="activity-text">Fraud database synchronization completed</p>
              <p className="activity-time">8 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
