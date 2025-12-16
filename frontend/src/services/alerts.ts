import { request } from './client';
import { AlertItem } from '../types/api';

export const alertService = {
  updateAlertStatus: async (alertId: string, status: 'approved' | 'rejected' | 'escalated', note?: string): Promise<void> => {
    return request(`/fraud-rules/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  getAlerts: async (status?: string, severity?: string): Promise<AlertItem[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    return request(`/fraud-rules/alerts?${params.toString()}`);
  },

  sendAIFeedback: async (insightId: string, isPositive: boolean): Promise<{ success: boolean }> => {
    return request('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify({ insight_id: insightId, is_positive: isPositive }),
    });
  },
};
