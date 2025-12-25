import { request } from './client';
import { NotificationItem } from '../types/api';

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    return request('/notifications/history');
  }
};

// Note: residualService has been split into:
// - alertService (alerts.ts)
// - reconciliationService (reconciliation.ts)
// - userService (user.ts)
