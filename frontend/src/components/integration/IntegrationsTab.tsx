import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Webhook, Globe, Zap, Database, Server, CheckCircle, Clock, AlertCircle, Settings, ExternalLink } from 'lucide-react';
import type { Integration } from '../../lib/api';

interface IntegrationsTabProps {
  integrations: Integration[];
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ integrations }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-slate-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'webhook':
        return <Webhook className="w-4 h-4 text-blue-500" />;
      case 'rest_api':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'graphql':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'database':
        return <Database className="w-4 h-4 text-orange-500" />;
      default:
        return <Server className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="integrations-grid">
        {filteredIntegrations.map((integration) => (
          <div key={integration.id} className="integration-card">
            <div className="integration-header">
              <div className="integration-icon">
                {getTypeIcon(integration.type)}
              </div>
              <div className="integration-info">
                <h3 className="integration-name">{integration.name}</h3>
                <p className="integration-description">{integration.description}</p>
              </div>
              <div className="integration-status">
                {getStatusIcon(integration.status)}
                <span className="status-text">{integration.status}</span>
              </div>
            </div>

            <div className="integration-details">
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{integration.type.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{integration.category}</span>
              </div>
              {integration.endpoint && (
                <div className="detail-row">
                  <span className="detail-label">Endpoint:</span>
                  <span className="detail-value endpoint">{integration.endpoint}</span>
                </div>
              )}
              {integration.lastUsed && (
                <div className="detail-row">
                  <span className="detail-label">Last Used:</span>
                  <span className="detail-value">{integration.lastUsed}</span>
                </div>
              )}
            </div>

            <div className="integration-metrics">
              <div className="metric">
                <span className="metric-label">Success Rate</span>
                <span className="metric-value">{(integration.successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Requests</span>
                <span className="metric-value">{integration.requestCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="integration-actions">
              <button className="action-button primary">
                Configure
              </button>
              <button className="action-button secondary">
                <ExternalLink className="w-3 h-3 mr-1" />
                Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default IntegrationsTab;
