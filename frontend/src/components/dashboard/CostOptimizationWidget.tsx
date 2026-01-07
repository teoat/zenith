import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, Target, Zap } from 'lucide-react';
import { costOptimizationService } from '@/services/costOptimization';
import { secureLogger } from '@/utils/secureLogger';

interface CostOptimizationData {
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

export const CostOptimizationWidget: React.FC = () => {
  const [costData, setCostData] = React.useState<CostOptimizationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCostData = async () => {
      try {
        setLoading(true);
        // Mock data for now - will be replaced with real API call
        const response = await costOptimizationService.getInfrastructureCosts();
        setCostData(response);
      } catch (err) {
        setError('Failed to load cost optimization data');
        secureLogger.error('Cost optimization widget error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCostData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !costData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <DollarSign className="w-5 h-5" />
            Cost Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const annualSavings = costData.projected_savings * 12;
  const topOptimizations = costData.optimizations.slice(0, 3);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Cost Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${annualSavings.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Annual Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {costData.roi_percentage}%
            </div>
            <div className="text-xs text-muted-foreground">ROI</div>
          </div>
        </div>

        {/* Current Spend */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Monthly Spend</span>
          <span className="text-lg font-bold">${costData.current_spend.toLocaleString()}</span>
        </div>

        {/* Monthly Savings */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">Monthly Savings</span>
          <span className="text-lg font-bold text-green-600">
            ${costData.projected_savings.toLocaleString()}
          </span>
        </div>

        {/* Top Opportunities */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Target className="w-4 h-4" />
            Top Opportunities ({costData.optimizations.length} total)
          </h4>
          <div className="space-y-2">
            {topOptimizations.map((opt) => (
              <div key={opt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium">{opt.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {opt.category}
                    </Badge>
                    <Badge
                      variant={opt.complexity === 'low' ? 'default' :
                              opt.complexity === 'medium' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {opt.complexity}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">
                    ${opt.estimated_savings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">savings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          View Full Analysis
        </button>
      </CardContent>
    </Card>
  );
};

export default CostOptimizationWidget;