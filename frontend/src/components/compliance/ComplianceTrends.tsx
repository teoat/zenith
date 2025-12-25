import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Trend {
  period: string;
  score: number;
  alerts_count: number;
}

interface ComplianceTrendsProps {
  trends: Trend[];
}

export const ComplianceTrends: React.FC<ComplianceTrendsProps> = ({ trends }) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          <div>
            <CardTitle>Compliance Velocity & Health</CardTitle>
            <CardDescription>Historical compliance scores and alert patterns over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* List Section */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Period Summary</h4>
             <div className="space-y-2 overflow-y-auto max-h-[280px] pr-2 custom-scrollbar">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{trend.period}</p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {trend.alerts_count} active alerts
                      </p>
                    </div>
                  </div>
                  <Badge className={`${
                    trend.score >= 90 ? 'bg-indigo-500' : 
                    trend.score >= 80 ? 'bg-indigo-400' : 'bg-amber-500'
                  } border-none font-bold`}>
                    {trend.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
