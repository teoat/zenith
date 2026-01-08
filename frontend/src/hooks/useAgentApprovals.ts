import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/ai';
import { AgentApproval } from '@/types/api';

export const useAgentApprovals = () => {
  const queryClient = useQueryClient();

  const approvalsQuery = useQuery({
    queryKey: ['agentApprovals'],
    queryFn: () => aiService.getAgentApprovals(),
  });

  const updateApprovalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      aiService.updateApprovalStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentApprovals'] });
    },
  });

  return {
    approvals: approvalsQuery.data || [],
    isLoading: approvalsQuery.isLoading,
    isError: approvalsQuery.isError,
    updateApproval: updateApprovalMutation.mutate,
    isUpdating: updateApprovalMutation.isPending,
  };
};
