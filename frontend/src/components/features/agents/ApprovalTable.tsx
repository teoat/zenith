import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { AccessibleButton } from '@/components/ui/AccessibleButton';
import { AgentApproval } from '@/types/api';

interface ApprovalTableProps {
  approvals: AgentApproval[];
  onApproval: (id: string, action: 'approve' | 'reject') => void;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({ approvals, onApproval }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    return <Badge variant={variants[risk as keyof typeof variants]}>{risk.toUpperCase()}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Actions Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell className="font-medium">{approval.agentName}</TableCell>
                <TableCell>{approval.action}</TableCell>
                <TableCell className="font-mono text-sm">{approval.target}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${approval.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(approval.confidence * 100)}%</span>
                  </div>
                </TableCell>
                <TableCell>{getRiskBadge(approval.risk)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(approval.status)}
                    <span className="capitalize">{approval.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {approval.status === 'pending' && (
                    <div className="flex gap-2">
                      <AccessibleButton
                        onClick={() => onApproval(approval.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        aria-label={`Approve action ${approval.action}`}
                      >
                        Approve
                      </AccessibleButton>
                      <AccessibleButton
                        onClick={() => onApproval(approval.id, 'reject')}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
                        aria-label={`Reject action ${approval.action}`}
                      >
                        Reject
                      </AccessibleButton>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {approvals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No agent approvals match your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
