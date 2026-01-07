import { request } from "./client";
import type {
  MetricsData,
  LocationData,
  AIInsight,
  QueueItem,
  CaseAnalytics,
  TransactionAnalytics,
  SystemOverview,
  ReportResponse,
  CaseSummaryResponse,
  ReportTemplateInfo,
  ScheduledReport,
  ScheduledReportRequest,
  FinancialHealthData,
  ProjectTrackerData,
  TransactionFlow,
  BehavioralAnalyticsResponse,
  PredictiveStats,
} from "@/types/api";
import { API_BASE } from "@/config";

export const reportingService = {
  // Stats
  getMetrics: async (): Promise<MetricsData> => {
    return request("/stats/metrics");
  },

  getPredictiveStats: async (): Promise<PredictiveStats> => {
    return request("/stats/predictive");
  },

  getLocations: async (): Promise<LocationData[]> => {
    return request("/stats/locations");
  },

  getAIInsights: async (): Promise<AIInsight[]> => {
    return request("/ai/insights");
  },

  getReviewQueue: async (): Promise<QueueItem[]> => {
    return request("/queue/items");
  },

  // Analytics
  getCaseAnalytics: async (): Promise<CaseAnalytics> => {
    return request("/analytics/cases");
  },

  getTransactionAnalytics: async (): Promise<TransactionAnalytics> => {
    return request("/analytics/transactions");
  },

  getSystemOverview: async (): Promise<SystemOverview> => {
    return request("/analytics/overview");
  },

  getTemporalFlow: async (days: number = 30): Promise<TransactionFlow[]> => {
    return request(`/analytics/temporal-flow?days=${days}`);
  },

  getBehavioralAnalytics: async (): Promise<BehavioralAnalyticsResponse> => {
    return request("/analytics/behavioral");
  },

  // Reports
  generateReport: async (
    format: "pdf" | "html" | "csv" = "pdf",
    template: "executive" | "standard" | "detailed" | "compliance" = "standard",
    options: { caseIds?: string[]; includeSensitiveData?: boolean } = {},
  ): Promise<ReportResponse> => {
    return request("/reporting/export", {
      method: "POST",
      body: JSON.stringify({ format, template, ...options }),
    });
  },

  getCaseSummary: async (caseId: string): Promise<CaseSummaryResponse> => {
    return request(`/reporting/summary/${caseId}`);
  },

  getReportTemplates: async (): Promise<ReportTemplateInfo[]> => {
    return request("/reporting/templates");
  },

  getScheduledReports: async (): Promise<ScheduledReport[]> => {
    return request("/reporting/scheduled");
  },

  createScheduledReport: async (
    requestBody: ScheduledReportRequest,
  ): Promise<ScheduledReport> => {
    return request("/reporting/scheduled", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  },

  deleteScheduledReport: async (
    scheduleId: string,
  ): Promise<{ message: string }> => {
    return request(`/reporting/scheduled/${scheduleId}`, {
      method: "DELETE",
    });
  },

  getFinancialHealth: async (caseId: string): Promise<FinancialHealthData> => {
    return request(`/reporting/financial-health/${caseId}`);
  },

  getProjectTracker: async (caseId: string): Promise<ProjectTrackerData> => {
    return request(`/reporting/project-tracker/${caseId}`);
  },

  generateAISummary: async (
    caseId: string,
    prompt?: string,
  ): Promise<{ summary: string }> => {
    return request("/ai/generate-summary", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId, prompt }),
    });
  },

  exportReport: async (
    caseId: string,
    format: "pdf" | "html" | "csv" = "pdf",
  ): Promise<Blob> => {
    const response = await fetch(
      `${API_BASE}/reporting/export/${caseId}?format=${format}`,
      {
        credentials: "include", // Use HttpOnly cookies
      },
    );
    return response.blob();
  },

  scheduleReport: async (reportData: any): Promise<any> => {
    return request("/reporting/schedule", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  },

  getReportHistory: async (): Promise<any[]> => {
    return request("/reporting/history");
  },
};
