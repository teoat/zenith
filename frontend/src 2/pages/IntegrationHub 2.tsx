import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Globe,
  Webhook,
  Database,
  Settings,
  Plus,
  Search,
  Filter,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  BarChart3,
  Users,
  Server,
  Cloud,
  Shield,
  TrendingUp
} from 'lucide-react';
import { api, Integration, IntegrationMetrics } from '../lib/api';

const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'marketplace' | 'graphql' | 'events' | 'analytics'>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      // Fetch real data (or mocked service data) via API facade
      const [integrationsData, metricsData] = await Promise.all([
         api.getIntegrations(),
         api.getIntegrationMetrics()
      ]);

      setIntegrations(integrationsData);
      setMetrics(metricsData);
    } catch (_error) {
      console.error('Failed to load integration data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="integration-hub-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Integration Hub...</p>
      </div>
    );
  }

  return (
    <div className="integration-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Globe className="w-8 h-8 text-blue-600 mr-3" />
              Integration Hub
            </h1>
            <p className="text-slate-600 mt-1">
              Connect and manage third-party integrations and APIs
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="metrics-overview">
          <div className="metric-card">
            <div className="metric-icon">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalIntegrations}</div>
              <div className="metric-label">Total Integrations</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.activeIntegrations}</div>
              <div className="metric-label">Active</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{(metrics.successRate * 100).toFixed(1)}%</div>
              <div className="metric-label">Success Rate</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.averageLatency}ms</div>
              <div className="metric-label">Avg Latency</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="hub-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'integrations', label: 'Integrations', icon: Server },
          { id: 'marketplace', label: 'API Marketplace', icon: Cloud },
          { id: 'graphql', label: 'GraphQL Federation', icon: Zap },
          { id: 'events', label: 'Event Bus', icon: Activity },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
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
        )}

        {activeTab === 'integrations' && (
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
        )}

        {activeTab === 'marketplace' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="marketplace-header">
              <h3 className="text-lg font-semibold mb-2">API Marketplace</h3>
              <p className="text-slate-600 mb-6">
                Discover and subscribe to enterprise APIs from our ecosystem of 500+ providers
              </p>
            </div>

            {/* API Categories */}
            <div className="marketplace-categories">
              <div className="category-card">
                <div className="category-icon">
                  <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="category-title">Financial Services</h4>
                <p className="category-description">Banking, payments, and financial data APIs</p>
                <div className="category-count">89 APIs</div>
              </div>

              <div className="category-card">
                <div className="category-icon">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="category-title">Compliance & Risk</h4>
                <p className="category-description">KYC, AML, sanctions screening, and risk assessment</p>
                <div className="category-count">67 APIs</div>
              </div>

              <div className="category-card">
                <div className="category-icon">
                  <Activity className="w-6 h-6 text-purple-500" />
                </div>
                <h4 className="category-title">Analytics & AI</h4>
                <p className="category-description">Business intelligence, ML models, and data analytics</p>
                <div className="category-count">45 APIs</div>
              </div>

              <div className="category-card">
                <div className="category-icon">
                  <Database className="w-6 h-6 text-orange-500" />
                </div>
                <h4 className="category-title">Data & Storage</h4>
                <p className="category-description">Databases, data lakes, and cloud storage services</p>
                <div className="category-count">78 APIs</div>
              </div>
            </div>

            {/* Featured APIs */}
            <div className="marketplace-featured">
              <h4 className="text-md font-semibold mb-4">Featured APIs</h4>
              <div className="featured-grid">
                <div className="featured-card">
                  <div className="featured-header">
                    <div className="featured-icon">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="featured-info">
                      <h5 className="featured-title">Fraud Detection API</h5>
                      <span className="featured-category">Security</span>
                    </div>
                  </div>
                  <p className="featured-description">Real-time fraud detection with 99.5% accuracy</p>
                  <div className="api-pricing">
                    <span className="price">$49/month</span>
                    <span className="rating">⭐ 4.8 (124 reviews)</span>
                  </div>
                  <button className="subscribe-button">Subscribe</button>
                </div>

                <div className="featured-card">
                  <div className="featured-header">
                    <div className="featured-icon">
                      <Database className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="featured-info">
                      <h5 className="featured-title">Global Sanctions API</h5>
                      <span className="featured-category">Compliance</span>
                    </div>
                  </div>
                  <p className="featured-description">Real-time sanctions screening against 200+ lists</p>
                  <div className="api-pricing">
                    <span className="price">$99/month</span>
                    <span className="rating">⭐ 4.9 (89 reviews)</span>
                  </div>
                  <button className="subscribe-button">Subscribe</button>
                </div>

                <div className="featured-card">
                  <div className="featured-header">
                    <div className="featured-icon">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="featured-info">
                      <h5 className="featured-title">Credit Scoring Engine</h5>
                      <span className="featured-category">Analytics</span>
                    </div>
                  </div>
                  <p className="featured-description">AI-powered credit risk assessment and scoring</p>
                  <div className="api-pricing">
                    <span className="price">$199/month</span>
                    <span className="rating">⭐ 4.7 (156 reviews)</span>
                  </div>
                  <button className="subscribe-button">Subscribe</button>
                </div>
              </div>
            </div>

            {/* API Search and Browse */}
            <div className="api-browse">
              <div className="browse-header">
                <h4 className="text-md font-semibold mb-4">Browse All APIs</h4>
                <div className="browse-controls">
                  <div className="search-bar">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search APIs..."
                      className="search-input"
                    />
                  </div>
                  <select className="filter-select">
                    <option>All Categories</option>
                    <option>Financial Services</option>
                    <option>Compliance & Risk</option>
                    <option>Analytics & AI</option>
                    <option>Data & Storage</option>
                  </select>
                </div>
              </div>

              <div className="api-grid">
                {/* API cards would be rendered here */}
                <div className="api-card">
                  <div className="api-header">
                    <h5 className="api-name">Transaction Monitoring API</h5>
                    <span className="api-type">REST</span>
                  </div>
                  <p className="api-description">Advanced transaction monitoring with pattern recognition</p>
                  <div className="api-meta">
                    <span className="provider">by FraudTech Inc.</span>
                    <span className="rating">⭐ 4.6</span>
                  </div>
                  <div className="api-footer">
                    <span className="price">$79/month</span>
                    <button className="view-details">View Details</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'graphql' && (
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
        )}

        {activeTab === 'events' && (
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
        )}

        {activeTab === 'analytics' && (
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationHub;