import { request } from './client';
import type { 
  ReconciliationItem, 
  CashFloatAnalysisResult, 
  BatchMatchResult, 
  TemporalAnalysisResult 
} from '@/types/api';

export const reconciliationService = {
  reconcileTransaction: async (transactionId: string, notes?: string): Promise<{ success: boolean }> => {
    return request(`/reconciliation/reconcile/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  flagTransaction: async (transactionId: string, reason: string): Promise<{ success: boolean }> => {
    return request(`/reconciliation/flag/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getReconciliationItems: async (status?: string): Promise<ReconciliationItem[]> => {
    const query = status ? `?status=${status}` : '';
    return request(`/reconciliation/items${query}`);
  },

  analyzeCashFloat: async (entityName: string, startDate: Date, endDate: Date): Promise<CashFloatAnalysisResult> => {
    return request('/reconciliation/cash-float', {
      method: 'POST',
      body: JSON.stringify({
        entity_name: entityName,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
    });
  },

  batchMatchWithdrawal: async (withdrawalId: string, tolerance: number = 0.05): Promise<BatchMatchResult> => {
    return request('/reconciliation/batch-match', {
      method: 'POST',
      body: JSON.stringify({ withdrawal_id: withdrawalId, tolerance })
    });
  },
  
  saveBatchMatch: async (withdrawalId: string, expenseIds: string[]): Promise<{ success: boolean; id?: string }> => {
      return request('/reconciliation/batch/save', {
          method: 'POST',
          body: JSON.stringify({ withdrawal_id: withdrawalId, expense_ids: expenseIds })
      });
  },

  analyzeTemporalPatterns: async (transactionIds: string[]): Promise<TemporalAnalysisResult> => {
      return request('/reconciliation/temporal-analysis', {
          method: 'POST',
          body: JSON.stringify({ transaction_ids: transactionIds })
      });
  },

  analyzeSequenceAnomalies: async (transactionIds: string[], fundingSourceId?: string): Promise<TemporalAnalysisResult> => {
      return request('/reconciliation/batch/analyze-sequence', {
          method: 'POST',
          body: JSON.stringify({ transaction_ids: transactionIds, funding_source_id: fundingSourceId })
      });
  },

  ingestMappedData: async (evidenceId: string, mapping: Record<string, string>): Promise<{ success: boolean; transactions_created: number }> => {
    return request('/reconciliation/ingest-mapped', {
      method: 'POST',
      body: JSON.stringify({ evidence_id: evidenceId, mapping })
    });
  }
};
