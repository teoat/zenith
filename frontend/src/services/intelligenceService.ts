/**
 * Frontend Intelligence Service Integration
 * Phase 5 Extension: Connects frontend to intelligence APIs
 * 
 * Provides service layer for:
 * - Fraud detection analysis
 * - Evidence processing
 * - Risk scoring
 */

import { request } from './client';
import { useState } from 'react';

// Types
export interface TransactionInput {
  id: string;
  amount: number;
  timestamp: string;
  source_account: string;
  destination_account: string;
  description: string;
  merchant?: string;
  category?: string;
}

export interface FraudAlert {
  alert_id: string;
  fraud_type: 'structuring' | 'round_trip' | 'velocity' | 'unusual_pattern';
  risk_score: number;
  confidence: number;
  transactions: string[];
  description: string;
  detected_at: string;
  details: Record<string, any>;
}

export interface RiskScore {
  account: string;
  risk_score: number;
  alert_count: number;
  fraud_types_detected: string[];
}

export interface EvidenceResult {
  file_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  ocr_confidence: number;
  metadata: Record<string, any>;
  processed_at: string;
  has_suspicious_indicators: boolean;
}

export interface EvidenceSearchResult {
  file_id: string;
  filename: string;
  file_type: string;
  snippet: string;
  ocr_confidence: number;
  processed_at: string;
}

export interface RedactionResult {
    transaction_id: string;
    original_masked: string;
    resolved_name: string | null;
    confidence_score: number;
    triangulation_logic: string[];
}

export interface LIBRAnalysisResult {
    account_id: string;
    commingling_ratio: number;
    illicit_float_detected: number;
    libr_violation_count: number;
    status: string;
    findings: string;
}

export interface IntentResult {
    evidence_id: string;
    primary_intent: string;
    confidence: number;
    justification: string;
    mens_rea_matrix: Record<string, number>;
}

export interface ZenithScore {
    project_id: string;
    overall_zenith_score: number;
    pillars: Record<string, number>;
    status: string;
    last_updated: string;
    recommendations: string[];
}

class IntelligenceService {
  /**
   * Analyze transactions for fraud patterns
   */
  async analyzeFraud(transactions: TransactionInput[]): Promise<FraudAlert[]> {
    return request('/intelligence/fraud/analyze', {
        method: 'POST',
        body: JSON.stringify({ transactions })
    });
  }

  /**
   * Calculate risk score for an account
   */
  async calculateRiskScore(
    account: string,
    transactions: TransactionInput[]
  ): Promise<RiskScore> {
    return request(`/intelligence/fraud/risk-score/${account}`, {
        method: 'POST',
        body: JSON.stringify({ transactions })
    });
  }

  /**
   * Process evidence file
   */
  async processEvidence(file: File): Promise<EvidenceResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Note: request helper handles JSON by default, for FormData we need to pass headers manually or adjust helper
    // Since our request helper sets Content-Type to application/json, we override it here.
    return request('/intelligence/evidence/process', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' }, // Browser will set boundary
        body: formData
    });
  }

  /**
   * Search processed evidence
   */
  async searchEvidence(query: string): Promise<EvidenceSearchResult[]> {
    return request(`/intelligence/evidence/search?query=${encodeURIComponent(query)}`);
  }

  /**
   * Probabilistic unmasking of redacted transaction names
   */
  async triangulateRedaction(transaction_id: string, masked_name: string): Promise<RedactionResult> {
    return request('/forensic-intel/triangulate', {
        method: 'POST',
        body: JSON.stringify({ transaction_id, masked_name })
    });
  }

  /**
   * Analyze mixed funds using LIBR
   */
  async runLIBRAnalysis(account_id: string, start_date: string, end_date: string): Promise<LIBRAnalysisResult> {
    return request('/forensic-intel/libr-analysis', {
        method: 'POST',
        body: JSON.stringify({ account_id, start_date, end_date })
    });
  }

  /**
   * Attribute intent (Mens Rea) from evidence
   */
  async attributeIntent(evidence_id: string, content: string): Promise<IntentResult> {
    return request('/forensic-intel/attribute-intent', {
        method: 'POST',
        body: JSON.stringify({ evidence_id, content })
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    return request('/intelligence/health');
  }

  /**
   * Get the overall Zenith health score for a project
   */
  async getZenithScore(project_id: string): Promise<ZenithScore> {
    return request(`/forensic-intel/zenith-score/${project_id}`);
  }

  /**
   * Validate AI-imputed forensic data
   */
  async validateImputation(original: any, imputed: any): Promise<any> {
    return request('/forensic-intel/validate-imputation', {
        method: 'POST',
        body: JSON.stringify({ original, imputed })
    });
  }

  /**
   * Check for structuring (Smurfing) patterns
   */
  async checkStructuring(account_id: string): Promise<any> {
    return request(`/forensic-intel/aml/structuring/${account_id}`);
  }

  /**
   * Trace Ultimate Beneficial Owners
   */
  async traceUBO(entity_name: string): Promise<any> {
    return request(`/forensic-intel/aml/ubo-trace/${encodeURIComponent(entity_name)}`);
  }

  /**
   * Sign a forensic report with PQ signatures
   */
  async signReport(project_id: string, content: string): Promise<any> {
    return request('/forensic-intel/sign-report', {
        method: 'POST',
        body: JSON.stringify({ project_id, content })
    });
  }

  /**
   * Synchronize local knowledge with the Federated Forensic Mesh
   */
  async zenithFederatedSync(): Promise<any> {
    return request('/forensic-intel/zenith/federated-sync', { method: 'POST' });
  }

  /**
   * Verify artifact integrity using Adversarial Forensic Shield
   */
  async zenithShieldVerify(artifact_id: string): Promise<any> {
    return request(`/forensic-intel/zenith/shield-verify/${artifact_id}`);
  }

  /**
   * Execute Autonomous Forensic Hunting Agents
   */
  async zenithAutonomousHunt(): Promise<any> {
    return request('/forensic-intel/zenith/autonomous-hunt', { method: 'POST' });
  }
}

// Export singleton instance
export const intelligenceService = new IntelligenceService();

// React Hook for fraud analysis
export function useFraudAnalysis() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (transactions: TransactionInput[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await intelligenceService.analyzeFraud(transactions);
      setAlerts(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, alerts, loading, error };
}

// React Hook for evidence processing
export function useEvidenceProcessor() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<EvidenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setProcessing(true);
    setError(null);
    
    try {
      const evidence = await intelligenceService.processEvidence(file);
      setResult(evidence);
      return evidence;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      setError(message);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return { processFile, result, processing, error };
}

export default intelligenceService;
