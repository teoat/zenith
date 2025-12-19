import { useQuery } from '@tanstack/react-query';
import type { MetricsData } from '../lib/api';
import { api } from '../lib/api';

export const useDashboardMetrics = () => {
  return useQuery<MetricsData, Error>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.getMetrics(),
    // Refetch every 2 minutes to keep dashboard fresh (reduced from 1 min for performance)
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    staleTime: 60 * 1000, // 1 minute - dashboard data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true, // Refetch when window regains focus
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};
