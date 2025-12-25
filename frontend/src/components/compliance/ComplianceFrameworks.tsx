import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Shield, Sparkles } from 'lucide-react';

export const ComplianceFrameworks: React.FC = () => {
  const frameworks = [
    { name: 'BSA/AML', score: 95, status: 'compliant' },
    { name: 'FATF Standards', score: 92, status: 'compliant' },
    { name: 'EU AMLD5', score: 88, status: 'review' },
    { name: 'OFAC Sanctions', score: 96, status: 'compliant' },
    { name: 'MAS Notice 626', score: 91, status: 'compliant' },
    { name: 'SOX Controls', score: 89, status: 'review' }
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-blue-500" />
          <CardTitle>Regulatory Framework Compliance</CardTitle>
        </div>
        <CardDescription>
          Live compliance status across multi-jurisdictional regulatory frameworks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworks.map((framework, index) => (
            <div 
              key={index} 
              className="group relative space-y-3 p-5 border rounded-2xl bg-white dark:bg-slate-900 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">{framework.name}</span>
                <Badge
                  variant={framework.status === 'compliant' ? 'default' : 'secondary'}
                  className={`${
                    framework.status === 'compliant' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                  } transition-colors`}
                >
                  {framework.score}%
                </Badge>
              </div>
              <div className="relative pt-1">
                <Progress
                  value={framework.score}
                  className="h-2 bg-slate-100 dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  {framework.status === 'compliant' ? (
                    <span className="flex items-center gap-1 text-emerald-500 uppercase">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Fully Compliant
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-500 uppercase">
                      ⚠️ Under Review
                    </span>
                  )}
                </p>
                <button className="text-[10px] font-bold text-blue-500 uppercase hover:underline">View Roadmap</button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
