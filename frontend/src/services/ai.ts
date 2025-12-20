import { request } from './client';
import type { AIPersona } from '../context/AIContext';
import type { ApiResponse } from '../types/api-responses';

interface AIChatResponse {
  message: string;
  persona: AIPersona;
  suggestions?: Array<{ action: string; confidence: number }>;
}

interface MultiPersonaAnalysis {
  caseId: string;
  analyses: Array<{
    persona: AIPersona;
    analysis: string;
    confidence: number;
  }>;
}

class AIService {
  async chat(message: string, context: Record<string, unknown>, persona: AIPersona = 'frenly'): Promise<ApiResponse<AIChatResponse>> {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, persona })
    });
  }

  async getMultiPersonaAnalysis(caseId: string, personas: AIPersona[] = ['frenly', 'legal', 'forensic', 'investigator']): Promise<ApiResponse<MultiPersonaAnalysis>> {
    return request('/ai/multi-persona-analysis', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId, personas })
    });
  }

  async investigateSubject(subjectId: string): Promise<ApiResponse<unknown>> {
    return request(`/ai/investigate/${subjectId}`, { method: 'POST' });
  }

  async getProactiveSuggestions(alertId: string, context: string): Promise<ApiResponse<unknown>> {
    return request('/ai/proactive-suggestions', {
      method: 'POST',
      body: JSON.stringify({ alert_id: alertId, context })
    });
  }

  async search(query: string, limit: number = 10): Promise<ApiResponse<unknown>> {
    return request('/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit })
    });
  }

  async indexEvidence(evidenceId: string): Promise<ApiResponse<unknown>> {
    return request('/ai/index-evidence', {
      method: 'POST',
      body: JSON.stringify({ evidence_id: evidenceId })
    });
  }
}

export const aiService = new AIService();
