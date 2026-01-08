import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/services/ai';
import { AgentDraft } from '@/types/api';

export const useAgentDrafts = () => {
  const queryClient = useQueryClient();

  const draftsQuery = useQuery({
    queryKey: ['agentDrafts'],
    queryFn: () => aiService.getAgentDrafts(),
  });

  const updateDraftMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AgentDraft> }) =>
      aiService.updateAgentDraft(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentDrafts'] });
    },
  });

  return {
    drafts: draftsQuery.data || [],
    isLoading: draftsQuery.isLoading,
    isError: draftsQuery.isError,
    updateDraft: updateDraftMutation.mutate,
    isUpdating: updateDraftMutation.isPending,
  };
};
