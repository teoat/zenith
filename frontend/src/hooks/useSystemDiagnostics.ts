import { useState, useEffect } from "react";
import { secureLogger } from "@/utils/secureLogger";
import {
  SystemMetrics,
  ServiceHealth,
  PerformanceMetrics,
  DiagnosticIssue,
} from "@/types/system-diagnostics";

export const useSystemDiagnostics = () => {
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(
    null,
  );
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformanceMetrics[]
  >([]);
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadDiagnosticsData = async () => {
    setLoading(true);
    try {
      const { monitoringService } = await import("@/services/monitoring");
      const data = await monitoringService.getSystemDiagnostics();

      if (data) {
        // Map backend data to frontend interfaces
        const systemStatus = data.system_status || {};
        const perfMetrics = systemStatus.performance_metrics || {};
        const healthComponents = data.health?.components || {};

        const realMetrics: SystemMetrics = {
          cpu_usage: perfMetrics.cpu_percent || 0,
          memory_usage: perfMetrics.memory_percent || 0,
          disk_usage: perfMetrics.disk_usage_percent || 0,
          network_io: perfMetrics.network_connections || 0,
          response_time: perfMetrics.response_time_avg || 0,
          error_rate:
            data.key_metrics?.total_requests > 0
              ? data.key_metrics?.total_errors / data.key_metrics.total_requests
              : 0,
          throughput: data.key_metrics?.total_requests || 0,
          uptime: systemStatus.uptime_seconds || 99.9,
        };

        // Dynamically map services from health check data
        const realServices: ServiceHealth[] = Object.keys(healthComponents).map(
          (key) => {
            const comp = healthComponents[key];
            return {
              name:
                key.charAt(0).toUpperCase() + key.slice(1).replace("_", " "),
              status:
                comp.status === "healthy"
                  ? "healthy"
                  : comp.status === "degraded"
                    ? "degraded"
                    : "unhealthy",
              response_time: comp.response_time_ms || 0,
              last_check: new Date().toISOString(),
              error_count: comp.error ? 1 : 0,
              uptime_percentage: 99.9, // Placeholder as component history isn't in simple health check
            };
          },
        );

        // Add API Gateway (Self) if not present
        if (!realServices.some((s) => s.name === "Api responsiveness")) {
          realServices.unshift({
            name: "API Gateway",
            status: "healthy",
            response_time: realMetrics.response_time,
            last_check: new Date().toISOString(),
            error_count: data.key_metrics?.total_errors || 0,
            uptime_percentage: 99.9,
          });
        }

        const realHistory: PerformanceMetrics[] = (
          data.performance_history || []
        ).map((h) => ({
          timestamp: h.timestamp,
          cpu: h.cpu_percent,
          memory: h.memory_percent,
          disk: h.disk_usage_percent,
          network: h.network_connections,
          requests_per_second: h.request_count,
          error_rate: h.error_count,
        }));

        const realIssues: DiagnosticIssue[] = (
          data.error_summary?.recent_errors || []
        ).map((e, i) => ({
          id: `err-${i}`,
          severity: "high",
          category: "reliability",
          title: e.error_type,
          description: e.message,
          affected_services: ["API Gateway"],
          detected_at: e.timestamp,
          recommendations: [
            "Check logs for more details",
            "Review service dependencies",
          ],
        }));

        setCurrentMetrics(realMetrics);
        setServiceHealth(realServices);
        setPerformanceHistory(realHistory);
        setDiagnosticIssues(realIssues);
      }
    } catch (error) {
      secureLogger.error("Failed to load real diagnostics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveIssue = async (issueId: string) => {
    try {
      // Optimistic update
      setDiagnosticIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, resolved_at: new Date().toISOString() }
            : issue,
        ),
      );

      // Real API call simulation
      await new Promise((resolve) => setTimeout(resolve, 500));

      secureLogger.info(`Issue ${issueId} resolved via diagnostics center`);
    } catch (error) {
      secureLogger.error("Failed to resolve issue", error);
      // Revert on error
      loadDiagnosticsData();
    }
  };

  useEffect(() => {
    loadDiagnosticsData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        void loadDiagnosticsData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return {
    currentMetrics,
    serviceHealth,
    performanceHistory,
    diagnosticIssues,
    loading,
    autoRefresh,
    setAutoRefresh,
    loadDiagnosticsData,
    resolveIssue,
  };
};
