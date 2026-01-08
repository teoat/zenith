import React from 'react';
import { CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { ComplianceCheck, RegulatoryAlert, ComplianceReport } from '@/types/compliance';

interface ComplianceStatsProps {
  checks: ComplianceCheck[];
  alerts: RegulatoryAlert[];
  reports: ComplianceReport[];
}

export const ComplianceStats: React.FC<ComplianceStatsProps> = ({
  checks,
  alerts,
  reports
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-green-50 rounded-full">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <div className="text-2xl font-bold">{checks.filter(c => c.status === 'compliant').length}</div>
          <div className="text-sm text-slate-500">Compliant Checks</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-red-50 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <div className="text-2xl font-bold">{checks.filter(c => c.status === 'non_compliant').length}</div>
          <div className="text-sm text-slate-500">Non-Compliant</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-yellow-50 rounded-full">
          <Clock className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <div className="text-2xl font-bold">{alerts.length}</div>
          <div className="text-sm text-slate-500">Active Alerts</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-full">
          <FileText className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <div className="text-2xl font-bold">{reports.length}</div>
          <div className="text-sm text-slate-500">Reports Generated</div>
        </div>
      </div>
    </div>
  );
};
