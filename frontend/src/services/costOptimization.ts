import { request, API_BASE, getToken } from './client';

export interface OptimizationsResult {
    current_spend: number;
    projected_savings: number;
    optimizations: Array<{
        id: string;
        title: string;
        category: string;
        savings: number;
        complexity: string;
        estimated_savings: number;
    }>;
    roi_percentage: number;
}

export const costOptimizationService = {
  getInfrastructureCosts: async (): Promise<OptimizationsResult> => {
    return request('/cost-optimization/infrastructure/costs');
  },

  getSavingsProjection: async (months: number = 12): Promise<any> => {
    const params = new URLSearchParams();
    params.append('months', months.toString());
    return request(`/cost-optimization/savings/projection?${params.toString()}`);
  },

  applyCostOptimization: async (optimizationId: string): Promise<any> => {
    return request(`/cost-optimization/optimization/${optimizationId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ optimization_id: optimizationId })
    });
  }
};