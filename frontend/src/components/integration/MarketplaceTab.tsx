import React from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Shield, Activity, Database, BarChart3 } from 'lucide-react';

const MarketplaceTab: React.FC = () => {
  return (
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
  );
};

export default MarketplaceTab;
