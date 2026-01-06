import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { PerformanceMetrics } from '@/types/system-diagnostics';

interface SystemPerformanceTabProps {
  performanceHistory: PerformanceMetrics[];
  currentMetrics: any; // Using explicit type locally or imported if needed, but for simplicity relying on prop structure
}

export const SystemPerformanceTab: React.FC<SystemPerformanceTabProps> = ({ performanceHistory }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends (Last 24 Hours)</CardTitle>
        <CardDescription>
          Historical performance metrics and system resource usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">CPU Usage Trend</span>
              <span className="text-sm text-gray-600">Average: 42.3%</span>
            </div>
            <div className="h-32 bg-gray-100 rounded flex items-end space-x-1 p-2">
              {performanceHistory.slice(0, 24).reverse().map((metric, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t flex-1 min-w-[2px] bar-fill"
                  style={{ height: `${metric.cpu}%` }}
                  title={`${metric.cpu.toFixed(1)}% at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Usage Trend</span>
              <span className="text-sm text-gray-600">Average: 65.1%</span>
            </div>
            <div className="h-32 bg-gray-100 rounded flex items-end space-x-1 p-2">
              {performanceHistory.slice(0, 24).reverse().map((metric, index) => (
                <div
                  key={index}
                  className="bg-green-500 rounded-t flex-1 min-w-[2px] bar-fill"
                  style={{ height: `${metric.memory}%` }}
                  title={`${metric.memory.toFixed(1)}% at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Requests per Second</span>
              <span className="text-sm text-gray-600">Average: 1,247 req/s</span>
            </div>
            <div className="h-32 bg-gray-100 rounded flex items-end space-x-1 p-2">
              {performanceHistory.slice(0, 24).reverse().map((metric, index) => (
                <div
                  key={index}
                  className="bg-purple-500 rounded-t flex-1 min-w-[2px] bar-fill"
                  style={{ height: `${(metric.requests_per_second / 20)}%` }}
                   title={`${metric.requests_per_second.toFixed(0)} req/s at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
