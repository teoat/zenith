import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Users } from 'lucide-react';

export const EventBusView: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="event-bus">
        <h3 className="section-title">Event-Driven Architecture</h3>
        <p className="section-description">
          Asynchronous event processing with pub/sub messaging for real-time integrations
        </p>

        {/* Event Bus Status */}
        <div className="event-status">
          <div className="status-card">
            <div className="status-icon">
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <div className="status-content">
              <h3 className="status-title">Event Bus</h3>
              <p className="status-description">Active - Processing 1.2M events/hour</p>
            </div>
          </div>
        </div>

        {/* Event Types */}
        <div className="event-types">
          <h4 className="text-md font-semibold mb-4">Event Types</h4>
          <div className="events-grid">
            <div className="event-card">
              <div className="event-header">
                <h5 className="event-name">Transaction.Created</h5>
                <span className="event-version">v2.0</span>
              </div>
              <p className="event-description">Triggered when a new transaction is processed</p>
              <div className="event-meta">
                <span className="producer-count">3 producers</span>
                <span className="consumer-count">8 consumers</span>
              </div>
              <div className="event-schema">
                <h6 className="schema-title">Schema:</h6>
                <pre className="schema-code">
{`{
  "transactionId": "string",
  "amount": "number",
  "currency": "string",
  "timestamp": "date"
}`}
                </pre>
              </div>
            </div>

            <div className="event-card">
              <div className="event-header">
                <h5 className="event-name">Compliance.Alert</h5>
                <span className="event-version">v1.5</span>
              </div>
              <p className="event-description">Triggered when compliance violations are detected</p>
              <div className="event-meta">
                <span className="producer-count">1 producer</span>
                <span className="consumer-count">5 consumers</span>
              </div>
              <div className="event-schema">
                <h6 className="schema-title">Schema:</h6>
                <pre className="schema-code">
{`{
  "alertId": "string",
  "severity": "string",
  "description": "string",
  "entityId": "string"
}`}
                </pre>
              </div>
            </div>

            <div className="event-card">
              <div className="event-header">
                <h5 className="event-name">User.RiskUpdated</h5>
                <span className="event-version">v1.2</span>
              </div>
              <p className="event-description">Triggered when user risk profile is updated</p>
              <div className="event-meta">
                <span className="producer-count">2 producers</span>
                <span className="consumer-count">3 consumers</span>
              </div>
              <div className="event-schema">
                <h6 className="schema-title">Schema:</h6>
                <pre className="schema-code">
{`{
  "userId": "string",
  "riskScore": "number",
  "riskFactors": "array",
  "updatedAt": "date"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Event Stream */}
        <div className="event-stream">
          <h4 className="text-md font-semibold mb-4">Live Event Stream</h4>
          <div className="stream-container">
            <div className="event-item">
              <div className="event-icon">
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="event-content">
                <p className="event-message">Transaction.Created - ID: txn_789</p>
                <p className="event-time">2 seconds ago</p>
              </div>
            </div>

            <div className="event-item">
              <div className="event-icon">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
              <div className="event-content">
                <p className="event-message">Compliance.CheckCompleted - Status: PASSED</p>
                <p className="event-time">5 seconds ago</p>
              </div>
            </div>

            <div className="event-item">
              <div className="event-icon">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="event-content">
                <p className="event-message">User.RiskUpdated - User: usr_456</p>
                <p className="event-time">12 seconds ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
