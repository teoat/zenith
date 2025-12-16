<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
/**
 * Frontend Intelligence Service Integration
 * Phase 5 Extension: Connects frontend to intelligence APIs
 * 
 * Provides service layer for:
 * - Fraud detection analysis
 * - Evidence processing
 * - Risk scoring
 */

import { api } from '../lib/api';
import { useState } from 'react';
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
"""
Frontend Intelligence Service Integration
Phase 5 Extension: Connects frontend to intelligence APIs

Provides service layer for:
- Fraud detection analysis
- Evidence processing
- Risk scoring
"""

import { api } from '../lib/api';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

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

class IntelligenceService {
  /**
   * Analyze transactions for fraud patterns
   */
  async analyzeFraud(transactions: TransactionInput[]): Promise<FraudAlert[]> {
    try {
      const response = await fetch('/api/intelligence/fraud/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) {
        throw new Error(`Fraud analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fraud analysis error:', error);
      throw error;
    }
  }

  /**
   * Calculate risk score for an account
   */
  async calculateRiskScore(
    account: string,
    transactions: TransactionInput[]
  ): Promise<RiskScore> {
    try {
      const response = await fetch(`/api/intelligence/fraud/risk-score/${account}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) {
        throw new Error(`Risk calculation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Risk calculation error:', error);
      throw error;
    }
  }

  /**
   * Process evidence file (PDF, image, text)
   */
  async processEvidence(file: File): Promise<EvidenceResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/intelligence/evidence/process', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Evidence processing failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Evidence processing error:', error);
      throw error;
    }
  }

  /**
   * Search processed evidence
   */
  async searchEvidence(query: string): Promise<EvidenceSearchResult[]> {
    try {
      const response = await fetch(
        `/api/intelligence/evidence/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Evidence search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Evidence search error:', error);
      throw error;
    }
  }

  /**
   * Get evidence processing statistics
   */
  async getStatistics(): Promise<{
    total_files: number;
    by_type: Record<string, number>;
    total_extracted_chars: number;
    avg_ocr_confidence: number;
    suspicious_images: number;
  }> {
    try {
      const response = await fetch('/api/intelligence/evidence/statistics', {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Statistics fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Statistics fetch error:', error);
      throw error;
    }
  }

  /**
   * Health check for intelligence services
   */
  async healthCheck(): Promise<{
    status: string;
    fraud_engine: string;
    evidence_processor: string;
    processed_files: number;
    fraud_alerts: number;
  }> {
    try {
      const response = await fetch('/api/intelligence/health');

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from storage
   */
  private getToken(): string {
    return localStorage.getItem('auth_token') || '';
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
