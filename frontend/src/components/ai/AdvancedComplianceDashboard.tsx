// frontend/src/components/ai/AdvancedComplianceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, Clock, FileText, RefreshCw, AlertTriangle,
  BookOpen, BarChart3, AlertCircle, StopCircle, Play
} from 'lucide-react';

import { ComplianceRule, ComplianceCheck, RegulatoryAlert, ComplianceReport } from '@/types/compliance';
import { ComplianceOverview } from '@/components/features/compliance/ComplianceOverview';
import { ComplianceRulesList } from '@/components/features/compliance/ComplianceRulesList';
import { ComplianceChecksList } from '@/components/features/compliance/ComplianceChecksList';
import { RegulatoryAlertsList } from '@/components/features/compliance/RegulatoryAlertsList';
import { ComplianceReportsList } from '@/components/features/compliance/ComplianceReportsList';

import { useComplianceDashboard } from '@/hooks/useComplianceDashboard';
import { ComplianceHeader } from '@/components/features/compliance/ComplianceHeader';
import { ComplianceStats } from '@/components/features/compliance/ComplianceStats';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'rules', label: 'Compliance Rules', icon: BookOpen },
  { id: 'checks', label: 'Compliance Checks', icon: CheckCircle },
  { id: 'alerts', label: 'Regulatory Alerts', icon: AlertCircle },
  { id: 'reports', label: 'Compliance Reports', icon: FileText }
] as const;

type TabId = typeof TABS[number]['id'];

const AdvancedComplianceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const {
    rules,
    checks,
    alerts,
    reports,
    isLoading,
    monitoringActive,
    toggleMonitoring,
    runComplianceCheck,
    acknowledgeAlert,
    refreshAll
  } = useComplianceDashboard();

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Advanced Compliance Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <ComplianceHeader
        monitoringActive={monitoringActive}
        onToggleMonitoring={toggleMonitoring}
        onRefresh={refreshAll}
      />

      <ComplianceStats
        checks={checks}
        alerts={alerts}
        reports={reports}
      />

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 bg-white p-1 rounded-t-lg">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <ComplianceOverview
            key="overview"
            complianceChecks={checks}
            monitoringActive={monitoringActive}
            complianceRules={rules}
            getFrameworkDisplayName={getFrameworkDisplayName}
          />
        )}

        {activeTab === 'rules' && (
          <ComplianceRulesList
            key="rules"
            complianceRules={rules}
            getFrameworkDisplayName={getFrameworkDisplayName}
            getRiskColor={getRiskColor}
          />
        )}

        {activeTab === 'checks' && (
          <ComplianceChecksList
            key="checks"
            complianceChecks={checks}
            complianceRules={rules}
            onRunChecks={(ruleId, entityId) => runComplianceCheck({ ruleId, entityId })}
            getStatusColor={getStatusColor}
          />
        )}

        {activeTab === 'alerts' && (
          <RegulatoryAlertsList
            key="alerts"
            regulatoryAlerts={alerts}
            getFrameworkDisplayName={getFrameworkDisplayName}
            getRiskColor={getRiskColor}
            onAcknowledge={acknowledgeAlert}
          />
        )}

        {activeTab === 'reports' && (
          <ComplianceReportsList
            key="reports"
            complianceReports={reports}
            getFrameworkDisplayName={getFrameworkDisplayName}
            getStatusColor={getStatusColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedComplianceDashboard;