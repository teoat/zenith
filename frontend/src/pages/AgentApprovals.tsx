// Agent Approvals page - Refactored
import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgentApprovals } from '@/hooks/useAgentApprovals';

// Sub-components
import { ApprovalStats } from '@/components/features/agents/ApprovalStats';
import { ApprovalFilters } from '@/components/features/agents/ApprovalFilters';
import { ApprovalTable } from '@/components/features/agents/ApprovalTable';
import LoadingState from '@/components/LoadingState';

const AgentApprovals: React.FC = () => {
  const { toast } = useToast();
  const { approvals, isLoading, isError, updateApproval } = useAgentApprovals();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

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
    updateApproval({ id, status: action === 'approve' ? 'approved' : 'rejected' }, {
        onSuccess: () => {
            toast({
                title: action === 'approve' ? 'Approved' : 'Rejected',
                description: `Agent action ${action}d successfully`,
            });
        },
        onError: () => {
            toast({
                title: 'Operation Failed',
                description: `Could not ${action} the agent action`,
                variant: 'destructive'
            });
        }
    });
  };

  if (isLoading) {
    return <div className="p-6"><LoadingState text="Loading Agent Approvals..." /></div>;
  }

  if (isError) {
      return (
          <div className="p-6 text-center">
              <p className="text-red-500">Failed to load agent approvals queue.</p>
          </div>
      );
  }

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

      <ApprovalStats approvals={approvals} />

      <ApprovalFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        riskFilter={riskFilter}
        onRiskChange={setRiskFilter}
      />

      <ApprovalTable 
        approvals={filteredApprovals}
        onApproval={handleApproval}
      />
    </div>
  );
};

export default AgentApprovals;