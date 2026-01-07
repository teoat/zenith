// frontend/src/components/ai/AdvancedComplianceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { simulateDelay } from '@/utils/simulation';
import { motion, AnimatePresence } from 'framer-motion';
import { secureLogger } from '@/utils/secureLogger';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
  BookOpen,
  BarChart3,
  Zap,
  StopCircle,
  Play
} from 'lucide-react';
import type {
  ComplianceRule,
  ComplianceCheck,
  RegulatoryAlert,
  ComplianceReport
} from './types/compliance';



const AdvancedComplianceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'checks' | 'alerts' | 'reports'>('overview');
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [regulatoryAlerts, setRegulatoryAlerts] = useState<RegulatoryAlert[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Mock data - would be replaced with actual API calls
      const mockRules: ComplianceRule[] = [
        {
          rule_id: 'kyc_verification',
          framework: 'us_patriot_act',
          title: 'Customer Identification and Verification',
          description: 'Verify customer identity using documentary evidence',
          risk_level: 'high',
          check_frequency: 'real-time',
          automated_check: true,
          manual_review_required: true,
          remediation_steps: [
            'Collect additional identification documents',
            'Verify identity through trusted third parties',
            'Enhanced due diligence for high-risk customers'
          ],
          reference_links: ['https://www.finra.org/rules-guidance/key-topics/know-your-customer']
        },
        {
          rule_id: 'transaction_monitoring',
          framework: 'amld5',
          title: 'Suspicious Transaction Monitoring',
          description: 'Monitor transactions for suspicious patterns and report SARs',
          risk_level: 'critical',
          check_frequency: 'real-time',
          automated_check: true,
          manual_review_required: true,
          remediation_steps: [
            'File Suspicious Activity Report (SAR)',
            'Freeze suspicious transactions',
            'Enhanced monitoring of involved parties'
          ],
          reference_links: ['https://www.fincen.gov/resources/statutes-regulations/guidance/msb-guidance']
        },
        {
          rule_id: 'sanctions_screening',
          framework: 'mas_notice_626',
          title: 'Sanctions and PEP Screening',
          description: 'Screen customers and transactions against sanctions lists',
          risk_level: 'critical',
          check_frequency: 'real-time',
          automated_check: true,
          manual_review_required: false,
          remediation_steps: [
            'Block transactions involving sanctioned entities',
            'Enhanced due diligence for PEP relationships',
            'Regular screening updates'
          ],
          reference_links: ['https://www.treasury.gov/resource-center/sanctions/Pages/default.aspx']
        }
      ];

      const mockChecks: ComplianceCheck[] = [
        {
          check_id: 'check_kyc_verification_cust_123_1703123456',
          rule_id: 'kyc_verification',
          entity_id: 'cust_123',
          entity_type: 'customer',
          status: 'compliant',
          risk_score: 0.15,
          findings: [],
          recommendations: [],
          checked_at: '2025-12-10T10:30:00Z',
          next_check_due: '2025-12-11T10:30:00Z'
        },
        {
          check_id: 'check_transaction_monitoring_txn_456_1703123456',
          rule_id: 'transaction_monitoring',
          entity_id: 'txn_456',
          entity_type: 'transaction',
          status: 'non_compliant',
          risk_score: 0.85,
          findings: ['Suspicious transaction pattern detected'],
          recommendations: [
            'File Suspicious Activity Report (SAR)',
            'Freeze suspicious transactions',
            'Enhanced monitoring of involved parties'
          ],
          checked_at: '2025-12-10T09:15:00Z',
          next_check_due: '2025-12-10T10:15:00Z'
        }
      ];

      const mockAlerts: RegulatoryAlert[] = [
        {
          alert_id: 'alert_check_transaction_monitoring_txn_456_1703123456',
          framework: 'amld5',
          severity: 'critical',
          title: 'Compliance Violation: Suspicious Transaction Monitoring',
          description: 'Non-compliant finding in transaction txn_456',
          affected_entities: ['txn_456'],
          required_action: 'Review and remediate compliance violation',
          deadline: '2025-12-17T09:15:00Z',
          escalation_level: 1,
          created_at: '2025-12-10T09:15:00Z',
          status: 'active'
        }
      ];

      const mockReports: ComplianceReport[] = [
        {
          report_id: 'report_us_patriot_act_1703123456',
          framework: 'us_patriot_act',
          period_start: '2025-11-10T00:00:00Z',
          period_end: '2025-12-10T00:00:00Z',
          overall_status: 'compliant',
          risk_summary: { low: 5, medium: 3, high: 2, critical: 0 },
          critical_findings: [],
          recommendations: [
            'Continue regular compliance training',
            'Update customer verification procedures'
          ],
          generated_at: '2025-12-10T08:00:00Z'
        }
      ];

      setComplianceRules(mockRules);
      setComplianceChecks(mockChecks);
      setRegulatoryAlerts(mockAlerts);
      setComplianceReports(mockReports);
      setMonitoringActive(true);

    } catch (error) {
      secureLogger.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      setMonitoringActive(!monitoringActive);
     } catch (error) {
       secureLogger.error('Failed to toggle monitoring:', error);
    }
  };

  const runComplianceCheck = async (ruleId: string, entityId: string) => {
    try {
      secureLogger.info(`Running compliance check: ${ruleId} for ${entityId}`);
      await simulateDelay(2000);
      await loadComplianceData();
     } catch (error) {
       secureLogger.error('Failed to run compliance check:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      secureLogger.info(`Acknowledging alert: ${alertId}`);
      await loadComplianceData();
     } catch (error) {
       secureLogger.error('Failed to acknowledge alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-50 border-green-200';
      case 'non_compliant': return 'text-red-600 bg-red-50 border-red-200';
      case 'under_review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'pending_approval': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const getFrameworkDisplayName = (framework: string) => {
    const names: Record<string, string> = {
      'us_patriot_act': 'US PATRIOT Act',
      'amld5': 'AMLD5 (EU)',
      'mas_notice_626': 'MAS Notice 626',
      'fatf_recommendations': 'FATF Recommendations',
      'sox': 'Sarbanes-Oxley Act',
      'gdpr': 'GDPR'
    };
    return names[framework] || framework.replace('_', ' ').toUpperCase();
  };



  if (loading) {
    return (
      <div className="advanced-compliance-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Advanced Compliance Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="advanced-compliance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              Advanced Compliance Technology
            </h1>
            <p className="text-slate-600 mt-1">
              Real-time regulatory monitoring and automated compliance
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-lg flex items-center ${
                monitoringActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {monitoringActive ? (
                <StopCircle className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button
              onClick={loadComplianceData}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Status Overview */}
      <div className="compliance-overview">
        <div className="status-cards">
          <div className="status-card">
            <div className="status-icon">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="status-content">
              <div className="status-value">
                {complianceChecks.filter(c => c.status === 'compliant').length}
              </div>
              <div className="status-label">Compliant Checks</div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="status-content">
              <div className="status-value">
                {complianceChecks.filter(c => c.status === 'non_compliant').length}
              </div>
              <div className="status-label">Non-Compliant</div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="status-content">
              <div className="status-value">{regulatoryAlerts.length}</div>
              <div className="status-label">Active Alerts</div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div className="status-content">
              <div className="status-value">{complianceReports.length}</div>
              <div className="status-label">Reports Generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'rules', label: 'Compliance Rules', icon: BookOpen },
          { id: 'checks', label: 'Compliance Checks', icon: CheckCircle },
          { id: 'alerts', label: 'Regulatory Alerts', icon: AlertCircle },
          { id: 'reports', label: 'Compliance Reports', icon: FileText }
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
            {/* Monitoring Status */}
            <div className="monitoring-status">
              <div className="status-card">
                <div className="status-icon">
                  {monitoringActive ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="status-content">
                  <h3 className="status-title">Regulatory Monitoring</h3>
                  <p className="status-description">
                    {monitoringActive
                      ? 'Active - Real-time compliance monitoring across all frameworks'
                      : 'Inactive - Click "Start Monitoring" to begin regulatory surveillance'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="critical-issues">
              <h3 className="section-title">Critical Compliance Issues</h3>
              <div className="issues-list">
                {complianceChecks.filter(check => check.status === 'non_compliant').map((check, index) => (
                  <div key={index} className="issue-item">
                    <div className="issue-icon">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="issue-content">
                      <p className="issue-text">
                        {check.entity_type} {check.entity_id} failed {check.rule_id.replace('_', ' ')}
                      </p>
                      <p className="issue-time">
                        {new Date(check.checked_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Framework Status */}
            <div className="framework-status">
              <h3 className="section-title">Regulatory Framework Status</h3>
              <div className="framework-grid">
                {['us_patriot_act', 'amld5', 'mas_notice_626', 'gdpr', 'sox'].map((framework, index) => {
                  const frameworkChecks = complianceChecks.filter(c =>
                    complianceRules.find(r => r.rule_id === c.rule_id)?.framework === framework
                  );
                  const compliantCount = frameworkChecks.filter(c => c.status === 'compliant').length;
                  const totalCount = frameworkChecks.length;
                  const complianceRate = totalCount > 0 ? (compliantCount / totalCount) * 100 : 100;

                  return (
                    <div key={index} className="framework-card">
                      <div className="framework-header">
                        <h4 className="framework-name">{getFrameworkDisplayName(framework)}</h4>
                        <div className="framework-status">
                          <span className={`status-badge ${complianceRate >= 95 ? 'compliant' : 'non-compliant'}`}>
                            {complianceRate >= 95 ? 'COMPLIANT' : 'REVIEW NEEDED'}
                          </span>
                        </div>
                      </div>
                      <div className="framework-metrics">
                        <div className="metric">
                          <span className="metric-label">Compliance Rate:</span>
                          <span className="metric-value">{complianceRate.toFixed(1)}%</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Checks:</span>
                          <span className="metric-value">{totalCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rules' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="compliance-rules">
              <h3 className="section-title">Compliance Rules by Framework</h3>

              <div className="rules-list">
                {complianceRules.map((rule, index) => (
                  <div key={index} className="rule-card">
                    <div className="rule-header">
                      <div className="rule-info">
                        <h4 className="rule-title">{rule.title}</h4>
                        <p className="rule-framework">{getFrameworkDisplayName(rule.framework)}</p>
                      </div>
                      <div className="rule-badges">
                        <span className={`risk-badge ${getRiskColor(rule.risk_level)}`}>
                          {rule.risk_level.toUpperCase()}
                        </span>
                        <span className="frequency-badge">
                          {rule.check_frequency}
                        </span>
                      </div>
                    </div>

                    <div className="rule-description">
                      <p>{rule.description}</p>
                    </div>

                    <div className="rule-details">
                      <div className="detail-row">
                        <span className="detail-label">Automated Check:</span>
                        <span className="detail-value">
                          {rule.automated_check ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Manual Review:</span>
                        <span className="detail-value">
                          {rule.manual_review_required ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                    </div>

                    {rule.remediation_steps.length > 0 && (
                      <div className="rule-remediation">
                        <h5 className="remediation-title">Remediation Steps:</h5>
                        <ul className="remediation-list">
                          {rule.remediation_steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="remediation-item">{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rule.reference_links.length > 0 && (
                      <div className="rule-references">
                        <h5 className="references-title">References:</h5>
                        <div className="references-list">
                          {rule.reference_links.map((link, linkIndex) => (
                            <a key={linkIndex} href={link} target="_blank" rel="noopener noreferrer"
                               className="reference-link">
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'checks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="compliance-checks">
              <h3 className="section-title">Compliance Check Results</h3>

              <div className="checks-controls">
                <button
                  onClick={() => runComplianceCheck('all', 'all')}
                  className="run-checks-button"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Run All Checks
                </button>
              </div>

              <div className="checks-list">
                {complianceChecks.map((check, index) => (
                  <div key={index} className="check-card">
                    <div className="check-header">
                      <div className="check-info">
                        <h4 className="check-id">{check.check_id}</h4>
                        <p className="check-entity">
                          {check.entity_type}: {check.entity_id}
                        </p>
                      </div>
                      <div className="check-status">
                        <span className={`status-badge ${getStatusColor(check.status)}`}>
                          {check.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="check-details">
                      <div className="detail-row">
                        <span className="detail-label">Rule:</span>
                        <span className="detail-value">
                          {complianceRules.find(r => r.rule_id === check.rule_id)?.title || check.rule_id}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Risk Score:</span>
                        <span className="detail-value">{(check.risk_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Checked:</span>
                        <span className="detail-value">
                          {new Date(check.checked_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Next Check:</span>
                        <span className="detail-value">
                          {new Date(check.next_check_due).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {check.findings.length > 0 && (
                      <div className="check-findings">
                        <h5 className="findings-title">Findings:</h5>
                        <ul className="findings-list">
                          {check.findings.map((finding, findingIndex) => (
                            <li key={findingIndex} className="finding-item">{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {check.recommendations.length > 0 && (
                      <div className="check-recommendations">
                        <h5 className="recommendations-title">Recommendations:</h5>
                        <ul className="recommendations-list">
                          {check.recommendations.map((rec, recIndex) => (
                            <li key={recIndex} className="recommendation-item">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="regulatory-alerts">
              <h3 className="section-title">Regulatory Alerts</h3>
              <p className="section-description">
                Critical compliance violations requiring immediate attention.
              </p>

              <div className="alerts-list">
                {regulatoryAlerts.map((alert, index) => (
                  <div key={index} className="alert-card">
                    <div className="alert-header">
                      <div className="alert-info">
                        <h4 className="alert-title">{alert.title}</h4>
                        <p className="alert-framework">{getFrameworkDisplayName(alert.framework)}</p>
                      </div>
                      <div className="alert-severity">
                        <span className={`severity-badge ${getRiskColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="alert-description">
                      <p>{alert.description}</p>
                    </div>

                    <div className="alert-details">
                      <div className="detail-row">
                        <span className="detail-label">Affected Entities:</span>
                        <span className="detail-value">{alert.affected_entities.join(', ')}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Deadline:</span>
                        <span className="detail-value">
                          {new Date(alert.deadline).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Escalation Level:</span>
                        <span className="detail-value">{alert.escalation_level}</span>
                      </div>
                    </div>

                    <div className="alert-action">
                      <h5 className="action-title">Required Action:</h5>
                      <p className="action-description">{alert.required_action}</p>
                    </div>

                    <div className="alert-controls">
                      {!alert.acknowledged_at && (
                        <button
                          onClick={() => acknowledgeAlert(alert.alert_id)}
                          className="acknowledge-button"
                        >
                          Acknowledge Alert
                        </button>
                      )}
                      {alert.acknowledged_at && !alert.resolved_at && (
                        <span className="acknowledged-status">Acknowledged</span>
                      )}
                      {alert.resolved_at && (
                        <span className="resolved-status">Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="compliance-reports">
              <h3 className="section-title">Compliance Reports</h3>
              <p className="section-description">
                Comprehensive compliance assessments for regulatory frameworks.
              </p>

              <div className="reports-list">
                {complianceReports.map((report, index) => (
                  <div key={index} className="report-card">
                    <div className="report-header">
                      <div className="report-info">
                        <h4 className="report-title">
                          {getFrameworkDisplayName(report.framework)} Report
                        </h4>
                        <p className="report-period">
                          {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="report-status">
                        <span className={`status-badge ${getStatusColor(report.overall_status)}`}>
                          {report.overall_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="report-metrics">
                      <h5 className="metrics-title">Risk Summary:</h5>
                      <div className="risk-breakdown">
                        {Object.entries(report.risk_summary).map(([risk, count]) => (
                          <div key={risk} className="risk-item">
                            <span className="risk-label">{risk}:</span>
                            <span className="risk-count">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.critical_findings.length > 0 && (
                      <div className="report-findings">
                        <h5 className="findings-title">Critical Findings:</h5>
                        <ul className="findings-list">
                          {report.critical_findings.map((finding, findingIndex) => (
                            <li key={findingIndex} className="finding-item">{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.recommendations.length > 0 && (
                      <div className="report-recommendations">
                        <h5 className="recommendations-title">Recommendations:</h5>
                        <ul className="recommendations-list">
                          {report.recommendations.map((rec, recIndex) => (
                            <li key={recIndex} className="recommendation-item">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="report-footer">
                      <div className="report-meta">
                        <span className="generated-date">
                          Generated: {new Date(report.generated_at).toLocaleString()}
                        </span>
                        {report.approved_by && (
                          <span className="approved-by">
                            Approved by: {report.approved_by}
                          </span>
                        )}
                      </div>
                      <button className="download-button">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedComplianceDashboard;