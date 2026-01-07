import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EvidenceMetadata } from '@/types/evidence';

interface ChainOfCustodyTimelineProps {
  evidence: EvidenceMetadata;
}

export const ChainOfCustodyTimeline: React.FC<ChainOfCustodyTimelineProps> = ({ evidence }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900 dark:text-white">
          <Shield className="h-5 w-5 mr-2 text-blue-500" />
          Chain of Custody: {evidence.filename}
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Complete audit trail of evidence handling and access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {evidence.chainOfCustody.map((event) => (
            <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {event.action}
                  </Badge>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{event.user}</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-500">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              {event.notes && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{event.notes}</p>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                Hash: {event.hash.slice(0, 16)}...
              </div>
              {event.location && (
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Location: {event.location}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className={`h-5 w-5 ${evidence.integrityVerified ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-semibold text-slate-900 dark:text-white">Integrity Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={
              evidence.integrityVerified
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }>
              {evidence.integrityVerified ? 'Verified' : 'Compromised'}
            </Badge>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Last verified: {new Date(evidence.lastAccessed).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
