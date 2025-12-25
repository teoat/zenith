import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Database, CheckCircle, Network, Lock } from 'lucide-react';

interface EvidenceStatsProps {
  totalItems: number;
}

export const EvidenceStats: React.FC<EvidenceStatsProps> = ({ totalItems }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Integrity Verified</p>
              <p className="text-2xl font-bold text-green-600">100%</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">AI Correlations</p>
              <p className="text-2xl font-bold">12 Active</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Network className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Secure Accesses</p>
              <p className="text-2xl font-bold">48 (24h)</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-full">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
