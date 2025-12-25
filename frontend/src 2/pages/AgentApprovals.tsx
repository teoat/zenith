// Agent Approvals page
import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AccessibleButton } from '@/components/common/AccessibleButton';

interface AgentApproval {
  id: string;
  agentName: string;
  action: string;
  target: string;
  confidence: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  risk: 'low' | 'medium' | 'high';
  details: string;
}

const AgentApprovals: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // Mock data - replace with real API
  const [approvals, setApprovals] = useState<AgentApproval[]>([
    {
      id: '1',
      agentName: 'FraudDetectionAgent',
      action: 'Flag Transaction',
      target: 'TXN-2024-001',
      confidence: 0.89,
      timestamp: '2024-12-17T10:30:00Z',
      status: 'pending',
      risk: 'high',
      details: 'Suspicious transaction pattern detected with 89% confidence'
    },
    {
      id: '2',
      agentName: 'ComplianceAgent',
      action: 'Escalate Case',
      target: 'CASE-2024-045',
      confidence: 0.76,
      timestamp: '2024-12-17T09:15:00Z',
      status: 'pending',
      risk: 'medium',
      details: 'Compliance violation detected in regulatory reporting'
    },
    {
      id: '3',
      agentName: 'RiskAssessmentAgent',
      action: 'Block Account',
      target: 'ACC-789012',
      confidence: 0.95,
      timestamp: '2024-12-17T08:45:00Z',
      status: 'approved',
      risk: 'high',
      details: 'High-risk account activity requiring immediate blocking'
    }
  ]);

  const filteredApprovals = useMemo(() => {
    return approvals.filter(approval => {
      const matchesSearch = approval.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           approval.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           approval.target.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || approval.risk === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [approvals, searchTerm, statusFilter, riskFilter]);

  const handleApproval = (id: string, action: 'approve' | 'reject') => {
    setApprovals(prev => prev.map(approval =>
      approval.id === id
        ? { ...approval, status: action === 'approve' ? 'approved' : 'rejected' }
        : approval
    ));

    toast({
      title: action === 'approve' ? 'Approved' : 'Rejected',
      description: `Agent action ${action}d successfully`,
    });
  };

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

  const stats = {
    total: approvals.length,
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Approvals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Review and approve automated agent actions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search agent actions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
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
              {filteredApprovals.map((approval) => (
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
                          onClick={() => handleApproval(approval.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          aria-label={`Approve action ${approval.action}`}
                        >
                          Approve
                        </AccessibleButton>
                        <AccessibleButton
                          onClick={() => handleApproval(approval.id, 'reject')}
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

          {filteredApprovals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No agent approvals match your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentApprovals;