import { request } from "./client";
import type { AIPersona } from "@/context/AIContext";
import type { ApiResponse } from "@/types/api-responses";

interface AIChatResponse {
  response: string;
  persona: AIPersona;
  suggestions?: Array<{
    id: string;
    label: string;
    type: string;
    impact?: string;
    action?: string;
    description?: string;
    entityType?: string;
    entityId?: string;
    payload?: Record<string, unknown>;
    reasoning?: string;
    confidence?: number;
    style?: "primary" | "danger" | "ghost";
    icon?: "alert" | "user" | "search" | "eye" | "file";
  }>;
  confidence?: number;
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
  async chat(
    message: string,
    context: Record<string, unknown>,
    persona: AIPersona = "frenly",
  ): Promise<ApiResponse<AIChatResponse>> {
    return request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, context, persona }),
    });
  }

  async getMultiPersonaAnalysis(
    caseId: string,
    personas: AIPersona[] = ["frenly", "legal", "forensic", "investigator"],
  ): Promise<ApiResponse<MultiPersonaAnalysis>> {
    return request("/ai/multi-persona-analysis", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId, personas }),
    });
  }

  async investigateSubject(subjectId: string): Promise<ApiResponse<unknown>> {
    return request(`/ai/investigate/${subjectId}`, { method: "POST" });
  }

  async getProactiveSuggestions(
    alertId: string,
    context: string,
  ): Promise<ApiResponse<unknown>> {
    return request("/ai/proactive-suggestions", {
      method: "POST",
      body: JSON.stringify({ alert_id: alertId, context }),
    });
  }

  async search(
    query: string,
    limit: number = 10,
  ): Promise<ApiResponse<unknown>> {
    return request("/ai/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  async indexEvidence(evidenceId: string): Promise<ApiResponse<unknown>> {
    return request("/ai/index-evidence", {
      method: "POST",
      body: JSON.stringify({ evidence_id: evidenceId }),
    });
  }

  async generateInsights(caseId: string): Promise<ApiResponse<any>> {
    return request("/ai/generate-insights", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId }),
    });
  }

  async getConversationHistory(sessionId: string): Promise<ApiResponse<any>> {
    return request(`/ai/conversation/${sessionId}`);
  }

  async getSuggestions(
    context: string,
    type: string,
  ): Promise<ApiResponse<any>> {
    return request("/ai/suggestions", {
      method: "POST",
      body: JSON.stringify({ context, type }),
    });
  }

  async predictFraudRisk(
    transactionData: Record<string, unknown>,
  ): Promise<ApiResponse<any>> {
    return request("/ai/fraud-prediction", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });
  }

  async analyzeSentiment(text: string): Promise<ApiResponse<any>> {
    return request("/ai/sentiment-analysis", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async performAction(
    endpoint: string,
    method: string = "POST",
    body?: Record<string, unknown>,
  ): Promise<ApiResponse<any>> {
    return request(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const aiService = new AIService();
