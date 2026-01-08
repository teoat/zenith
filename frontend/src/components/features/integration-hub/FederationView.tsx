import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Database, Shield } from 'lucide-react';

export const FederationView: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
        >
            <div className="graphql-federation">
                <h3 className="section-title">GraphQL Federation</h3>
                <p className="section-description">
                    Unified API layer with federated GraphQL services for seamless data access
                </p>

                {/* Federation Status */}
                <div className="federation-status">
                    <div className="status-card">
                        <div className="status-icon">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="status-content">
                            <h3 className="status-title">Federation Gateway</h3>
                            <p className="status-description">Operational - Composing 8 GraphQL services</p>
                        </div>
                    </div>
                </div>

                {/* Federated Services */}
                <div className="federated-services">
                    <h4 className="text-md font-semibold mb-4">Federated Services</h4>
                    <div className="services-grid">
                        <div className="service-card">
                            <div className="service-header">
                                <Zap className="w-5 h-5 text-blue-500" />
                                <h5 className="service-name">User Service</h5>
                            </div>
                            <p className="service-description">User management and authentication</p>
                            <div className="service-meta">
                                <span className="version">v2.1.0</span>
                                <span className="status healthy">Healthy</span>
                            </div>
                            <div className="service-entities">
                                <span className="entity-tag">User</span>
                                <span className="entity-tag">Profile</span>
                            </div>
                        </div>

                        <div className="service-card">
                            <div className="service-header">
                                <Database className="w-5 h-5 text-green-500" />
                                <h5 className="service-name">Transaction Service</h5>
                            </div>
                            <p className="service-description">Transaction processing and history</p>
                            <div className="service-meta">
                                <span className="version">v1.8.3</span>
                                <span className="status healthy">Healthy</span>
                            </div>
                            <div className="service-entities">
                                <span className="entity-tag">Transaction</span>
                                <span className="entity-tag">Account</span>
                            </div>
                        </div>

                        <div className="service-card">
                            <div className="service-header">
                                <Shield className="w-5 h-5 text-purple-500" />
                                <h5 className="service-name">Compliance Service</h5>
                            </div>
                            <p className="service-description">Regulatory compliance and reporting</p>
                            <div className="service-meta">
                                <span className="version">v3.2.1</span>
                                <span className="status healthy">Healthy</span>
                            </div>
                            <div className="service-entities">
                                <span className="entity-tag">ComplianceCheck</span>
                                <span className="entity-tag">Report</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Federation Query Interface */}
                <div className="federation-query">
                    <h4 className="text-md font-semibold mb-4">Federated Query Playground</h4>
                    <div className="query-interface">
                        <div className="query-editor">
                            <pre className="query-code">
                                {`query GetUserTransactions($userId: ID!) {
  user(id: $userId) {
    id
    name
    email
    transactions {
      id
      amount
      date
      compliance {
        status
        riskScore
      }
    }
  }
}`}
                            </pre>
                        </div>
                        <div className="query-result">
                            <h5 className="result-title">Query Result:</h5>
                            <pre className="result-json">
                                {`{
  "data": {
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "transactions": [...]
    }
  }
}`}
                            </pre>
                        </div>
                    </div>
                    <button className="execute-query">Execute Federated Query</button>
                </div>
            </div>
        </motion.div>
    );
};
