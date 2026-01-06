import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { TrendingUp, TrendingDown, Minus, Clock, Cpu, HardDrive, Zap, Server } from 'lucide-react';
import { SystemMetrics } from '@/types/system-diagnostics';

interface SystemOverviewCardsProps {
  metrics: SystemMetrics | null;
}

export const SystemOverviewCards: React.FC<SystemOverviewCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cpu_usage.toFixed(1)}%</div>
            <Progress value={metrics?.cpu_usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.1% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.memory_usage.toFixed(1)}%</div>
            <Progress value={metrics?.memory_usage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -1.5% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.response_time}ms</div>
            <Progress value={Math.min((metrics?.response_time || 0) / 5, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Minus className="inline h-3 w-3 mr-1" />
              Stable performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.uptime}%</div>
            <Progress value={metrics?.uptime} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="inline h-3 w-3 mr-1" />
              99.7% this month
            </p>
          </CardContent>
        </Card>
      </div>
  );
};
