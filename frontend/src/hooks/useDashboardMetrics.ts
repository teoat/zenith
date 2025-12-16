import { useQuery } from '@tanstack/react-query';
import { api, MetricsData } from '../lib/api';

export const useDashboardMetrics = () => {
  return useQuery<MetricsData, Error>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.getMetrics(),
    // Refetch every minute to keep dashboard fresh without manual reload
    refetchInterval: 60000, 
    staleTime: 30000,
  });
};
