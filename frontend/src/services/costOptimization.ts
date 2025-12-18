class CostOptimizationService {

  async getInfrastructureCosts() {
    // For now, return mock data until backend is fully integrated
    return {
      current_spend: 125000,
      projected_savings: 31250,
      optimizations: [
        {
          id: 'opt_1',
          title: 'Rightsize EC2 Instances',
          category: 'infrastructure',
          savings: 12000,
          complexity: 'medium',
          estimated_savings: 12000
        },
        {
          id: 'opt_2',
          title: 'Implement Reserved Instances',
          category: 'infrastructure',
          savings: 15000,
          complexity: 'low',
          estimated_savings: 15000
        },
        {
          id: 'opt_3',
          title: 'Optimize Storage Classes',
          category: 'infrastructure',
          savings: 400,
          complexity: 'medium',
          estimated_savings: 400
        }
      ],
      roi_percentage: 1200
    };
  }

  async applyOptimization() {
    // Mock implementation
    return {
      applied_at: new Date().toISOString(),
      estimated_savings: 12000,
      status: 'applied'
    };
  }
}

// Create service instance
export const costOptimizationService = new CostOptimizationService();