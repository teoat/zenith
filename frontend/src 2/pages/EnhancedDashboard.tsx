/**
 * Enhanced Dashboard with Advanced Analytics & Feature Showcase
 * Comprehensive front page presenting all platform capabilities and enhancements
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Shield,
  Zap,
  Brain,
  BarChart3,
  Globe,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon
} from 'lucide-react';

interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: LucideIcon;
  color: string;
}

interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'available' | 'beta' | 'coming_soon';
  metrics?: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  cta?: {
    text: string;
    action: () => void;
  };
}

interface AIInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actions: string[];
}

const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'features' | 'insights'>('overview');


  const coreMetrics: DashboardMetric[] = [
    {
      label: "Fraud Prevented",
      value: "$2.5M",
      change: 12.5,
      trend: "up",
      icon: Shield,
      color: "text-green-600"
    },
    {
      label: "Detection Rate",
      value: "94.2%",
      change: 2.1,
      trend: "up",
      icon: Target,
      color: "text-blue-600"
    },
    {
      label: "Response Time",
      value: "2.3h",
      change: -8.2,
      trend: "up", // Negative change is good for response time
      icon: Clock,
      color: "text-purple-600"
    },
    {
      label: "System Health",
      value: "99.97%",
      change: 0.1,
      trend: "stable",
      icon: Activity,
      color: "text-emerald-600"
    }
  ];

  const featureHighlights: FeatureHighlight[] = [
    {
      id: "ai_case_assignment",
      title: "AI-Powered Case Assignment",
      description: "Intelligent case routing based on analyst expertise and workload optimization",
      icon: Brain,
      status: "available",
      metrics: [
        { label: "Assignment Accuracy", value: "96%", trend: "up" },
        { label: "Time Saved", value: "40%", trend: "up" }
      ],
      cta: {
        text: "Configure Assignment Rules",
        action: () => console.log("Navigate to case assignment config")
      }
    },
    {
      id: "advanced_visualization",
      title: "3D Network Visualization",
      description: "Interactive force-directed graphs with real-time data streaming",
      icon: Globe,
      status: "available",
      metrics: [
        { label: "Pattern Discovery", value: "85%", trend: "up" },
        { label: "User Engagement", value: "3.2x", trend: "up" }
      ]
    },
    {
      id: "predictive_alerting",
      title: "Predictive Alerting System",
      description: "ML-based anomaly detection with automated incident response",
      icon: AlertTriangle,
      status: "available",
      metrics: [
        { label: "Alert Accuracy", value: "92%", trend: "up" },
        { label: "Response Time", value: "70% faster", trend: "up" }
      ]
    },
    {
      id: "explainable_ai",
      title: "Explainable AI Framework",
      description: "Human-interpretable fraud predictions with confidence scoring",
      icon: BarChart3,
      status: "available",
      metrics: [
        { label: "Investigator Trust", value: "95%", trend: "up" },
        { label: "Decision Speed", value: "60% faster", trend: "up" }
      ]
    },
    {
      id: "multimodal_detection",
      title: "Multi-Modal Fraud Detection",
      description: "Cross-channel analysis combining behavioral, social, and temporal patterns",
      icon: Sparkles,
      status: "available",
      metrics: [
        { label: "Detection Coverage", value: "360°", trend: "up" },
        { label: "False Positives", value: "-25%", trend: "up" }
      ]
    },
    {
      id: "advanced_analytics",
      title: "Advanced Analytics Dashboard",
      description: "Real-time business intelligence with predictive insights",
      icon: TrendingUp,
      status: "available",
      metrics: [
        { label: "ROI Visibility", value: "100%", trend: "up" },
        { label: "Executive Insights", value: "24/7", trend: "up" }
      ]
    },
    {
      id: "ai_code_review",
      title: "AI-Powered Code Review",
      description: "Automated code quality analysis and security vulnerability detection",
      icon: CheckCircle,
      status: "available",
      metrics: [
        { label: "Issue Detection", value: "94%", trend: "up" },
        { label: "Review Time", value: "-50%", trend: "up" }
      ],
      cta: {
        text: "Open Code Review",
        action: () => navigate('/code-review')
      }
    },
    {
      id: "predictive_maintenance",
      title: "Predictive System Maintenance",
      description: "AI-driven capacity planning and self-healing infrastructure",
      icon: Zap,
      status: "available",
      metrics: [
        { label: "Uptime", value: "99.9%", trend: "up" },
        { label: "Auto-Healing", value: "24/7", trend: "up" }
      ],
      cta: {
        text: "Open Maintenance Dashboard",
        action: () => navigate('/predictive-maintenance')
      }
    },
    {
      id: "advanced_compliance",
      title: "Advanced Compliance Technology",
      description: "Real-time regulatory monitoring and automated compliance checks",
      icon: Shield,
      status: "available",
      metrics: [
        { label: "Compliance Rate", value: "98.5%", trend: "up" },
        { label: "Alerts Resolved", value: "24/7", trend: "up" }
      ],
      cta: {
        text: "Open Compliance Dashboard",
        action: () => navigate('/advanced-compliance')
      }
    }
  ];

  const aiInsights: AIInsight[] = [
    {
      title: "Exceptional Fraud Detection Performance",
      description: "Detection rate of 94.2% with false positive rate of 3.1% exceeds industry benchmarks by 25%.",
      impact: "high",
      confidence: 0.95,
      actions: [
        "Share success metrics with executive team",
        "Consider expanding detection capabilities",
        "Evaluate model performance against additional datasets"
      ]
    },
    {
      title: "Rapid Case Resolution Achievement",
      description: "Average case resolution time of 18.5 hours demonstrates exceptional operational efficiency.",
      impact: "medium",
      confidence: 0.88,
      actions: [
        "Document resolution process best practices",
        "Set up monitoring for resolution time trends"
      ]
    },
    {
      title: "Outstanding Financial ROI",
      description: "Platform delivering 285% ROI, significantly exceeding investment expectations.",
      impact: "high",
      confidence: 0.92,
      actions: [
        "Prepare ROI analysis for executive presentation",
        "Identify additional cost-saving opportunities"
      ]
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Fraud Detection Platform</h1>
              <p className="text-slate-600 mt-1">Advanced AI-powered fraud prevention and investigation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">System Healthy</span>
              </div>
              <div className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'features', label: 'Features', icon: Sparkles },
              { id: 'insights', label: 'AI Insights', icon: Brain }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'analytics' | 'features' | 'insights')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Core Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coreMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${metric.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <metric.icon className={`w-6 h-6 ${metric.color}`} />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      {metric.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : metric.trend === 'down' ? (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-400" />
                      )}
                      <span className={`text-sm font-medium ml-1 ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Start New Investigation", icon: Users, color: "bg-blue-500" },
                      { label: "View Active Cases", icon: Target, color: "bg-green-500" },
                      { label: "Generate Report", icon: BarChart3, color: "bg-purple-500" },
                      { label: "Configure Alerts", icon: AlertTriangle, color: "bg-orange-500" }
                    ].map((action, index) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${action.color}`}>
                            <action.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-slate-700">{action.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { action: "High-risk transaction flagged", time: "2 minutes ago", type: "alert" },
                      { action: "Case #2024-001 resolved", time: "15 minutes ago", type: "success" },
                      { action: "New fraud pattern detected", time: "1 hour ago", type: "info" },
                      { action: "System health check passed", time: "2 hours ago", type: "success" }
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'alert' ? 'bg-red-500' :
                          activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                          <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Preview */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">🚀 New Features Available</h3>
                    <p className="text-blue-100 mb-4">
                      Discover the latest AI-powered enhancements designed to supercharge your fraud detection capabilities.
                    </p>
                    <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                      Explore Features
                    </button>
                  </div>
                  <div className="hidden lg:block">
                    <Sparkles className="w-16 h-16 text-white/20" />
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
              className="space-y-8"
            >
              {/* Advanced Analytics Dashboard */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Analytics Chart */}
                <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Trends</h3>
                  <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">3D Network Visualization</h4>
                      <p className="text-slate-600">Interactive fraud network analysis</p>
                    </div>
                  </div>
                </div>

                {/* Analytics Insights */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Key Metrics</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Monthly Savings", value: "$185K", change: "+12%" },
                        { label: "Detection Rate", value: "94.2%", change: "+2.1%" },
                        { label: "Response Time", value: "2.3h", change: "-8.2%" }
                      ].map((metric) => (
                        <div key={metric.label} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{metric.label}</span>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900">{metric.value}</span>
                            <span className={`text-xs ml-2 ${
                              metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {metric.change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Predictive Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Fraud Amount Trend</p>
                        <p className="text-xs text-blue-700">Expected +12% increase in next 3 months</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Detection Rate</p>
                        <p className="text-xs text-green-700">Stable performance with slight upward trend</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Feature Showcase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featureHighlights.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${
                        feature.status === 'available' ? 'bg-green-100' :
                        feature.status === 'beta' ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <feature.icon className={`w-6 h-6 ${
                          feature.status === 'available' ? 'text-green-600' :
                          feature.status === 'beta' ? 'text-blue-600' : 'text-slate-600'
                        }`} />
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        feature.status === 'available' ? 'bg-green-100 text-green-700' :
                        feature.status === 'beta' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {feature.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{feature.description}</p>

                    {feature.metrics && (
                      <div className="space-y-2 mb-4">
                        {feature.metrics.map((metric, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">{metric.label}</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-slate-900">{metric.value}</span>
                              {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {feature.cta && (
                      <button
                        onClick={feature.cta.action}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        {feature.cta.text}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Feature Roadmap */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">🚀 Coming Soon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-dashed border-slate-300 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Predictive System Maintenance</h4>
                    <p className="text-sm text-slate-600 mb-3">AI-driven capacity planning and self-healing infrastructure</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                      </div>
                      <span className="text-xs text-slate-500">75%</span>
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Advanced Compliance Technology</h4>
                    <p className="text-sm text-slate-600 mb-3">Real-time regulatory monitoring and automated compliance</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Coming Q1 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-lg p-6 border ${
                      insight.impact === 'high' ? 'border-red-200 bg-red-50' :
                      insight.impact === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        insight.impact === 'high' ? 'bg-red-100' :
                        insight.impact === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {insight.impact === 'high' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : insight.impact === 'medium' ? (
                          <TrendingUp className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">{insight.title}</h3>
                        <p className="text-slate-700 text-sm mb-3">{insight.description}</p>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-xs text-slate-500">
                            Confidence: {(insight.confidence * 100).toFixed(0)}%
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {insight.impact.toUpperCase()} IMPACT
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 mb-2">Recommended Actions:</h4>
                          <ul className="space-y-1">
                            {insight.actions.map((action, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                                <ChevronRight className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Insights Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Insights Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-sm text-slate-600">High-Impact Insights</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">92%</div>
                    <div className="text-sm text-slate-600">Average Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">7</div>
                    <div className="text-sm text-slate-600">Actionable Recommendations</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default EnhancedDashboard;