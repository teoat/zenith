import { request } from './client';
import { HealthMetrics, SystemMetrics, PerformanceData, ErrorSummary } from '../types/api';

export const monitoringService = {
  getHealthMetrics: async (): Promise<HealthMetrics> => {
    return request('/apm/summary');
  },

  getSystemStatus: async (): Promise<SystemMetrics> => {
    try {
      const response = await request<{ success: boolean; system_metrics: SystemMetrics }>('/apm/system-metrics');
      return response.system_metrics;
    } catch (_error) {
      console.error('Failed to get system status, returning fallback:', error);
       // Return fallback data ONLY if backend is truly unreachable, to prevent UI crash
      return {
        status: 'warning',
        health_score: 0,
        timestamp: new Date().toISOString(),
        metrics: {
          cpu_percent: 0,
          memory_percent: 0,
          memory_used_mb: 0,
          disk_usage_percent: 0,
          network_connections: 0,
          active_threads: 0,
          request_count: 0,
          error_count: 0,
          response_time_avg: 0,
        },
      };
    }
  },

  getPerformanceHistory: async (timeRangeHours: number = 24): Promise<PerformanceData[]> => {
    try {
      return await request<PerformanceData[]>(`/apm/performance-history?time_range_hours=${timeRangeHours}`);
    } catch (_error) {
      console.error('Failed to get performance history:', error);
      return [];
    }
  },

  getErrorSummary: async (timeRangeHours: number = 24): Promise<ErrorSummary> => {
    try {
      return await request<ErrorSummary>(`/apm/error-summary?time_range_hours=${timeRangeHours}`);
    } catch (_error) {
       console.error('Failed to get error summary:', error);
       return {
         total_errors: 0,
         error_types: {},
         recent_errors: []
       };
    }
  },
  
  reportError: async (errorData: unknown): Promise<void> => {
    try {
      await request('/apm/errors', {
        method: 'POST',
        body: JSON.stringify(errorData),
      });
    } catch (e) {
      console.error('Failed to send error report', e);
    }
  }
};
