import { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ComplianceMetric {
  id: string;
  title: string;
  value: number | string;
  status: "pass" | "fail" | "warning";
  trend?: "up" | "down" | "stable";
  description?: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  status: "compliant" | "non_compliant" | "partial";
  lastAudit: string;
  nextAudit: string;
}

import { complianceService } from "@/services/compliance";

export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const dashboardData = await complianceService.getComplianceDashboard();
        const regionalData = await complianceService.getRegionalCompliance();

        setMetrics([
          {
            id: "overall",
            title: "Overall Score",
            value: `${dashboardData.overall_compliance_score}%`,
            status:
              dashboardData.overall_compliance_score >= 90 ? "pass" : "warning",
            description: "Overall compliance health",
          },
          {
            id: "reports",
            title: "Pending Reports",
            value: dashboardData.pending_regulatory_reports.toString(),
            status:
              dashboardData.pending_regulatory_reports > 5 ? "fail" : "pass",
            description: "Regulatory filings due",
          },
          {
            id: "incidents",
            title: "Active Incidents",
            value: dashboardData.open_security_incidents.toString(),
            status: dashboardData.open_security_incidents > 0 ? "fail" : "pass",
            description: "Security incidents requiring attention",
          },
        ]);

        setFrameworks(
          regionalData.regions.map((r) => ({
            id: r.region,
            name: r.framework,
            version: "1.0",
            status: (r as any).status || "compliant",
            lastAudit: r.last_audit_date,
            nextAudit: r.next_audit_date,
          })),
        );
      } catch (error) {
        console.error("Failed to load compliance data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
      case "compliant":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail":
      case "non_compliant":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
      case "compliant":
        return "text-green-600 bg-green-50 border-green-200";
      case "fail":
      case "non_compliant":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
      case "partial":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Compliance Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor regulatory compliance across all frameworks
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Run Compliance Check
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(metric.status)}
                <h3 className="text-sm font-medium text-gray-900">
                  {metric.title}
                </h3>
              </div>
              {getTrendIcon(metric.trend)}
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {metric.value}
              </span>
              {typeof metric.value === "string" &&
                metric.value.includes("%") && (
                  <span className="text-sm text-gray-500">compliance</span>
                )}
            </div>

            {metric.description && (
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Frameworks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Compliance Frameworks
          </h2>
          <p className="text-sm text-gray-600">
            Current status of all regulatory frameworks
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Framework
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Audit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Audit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {frameworks.map((framework) => (
                <tr key={framework.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {framework.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {framework.version}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(framework.status)}`}
                    >
                      {getStatusIcon(framework.status)}
                      <span className="ml-1 capitalize">
                        {framework.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(framework.lastAudit).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(framework.nextAudit).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      View Details
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Run Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Action Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The following compliance issues need attention:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>HIPAA compliance audit due within 30 days</li>
                <li>GDPR partial compliance requires remediation</li>
                <li>Quarterly SOX audit preparation needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
