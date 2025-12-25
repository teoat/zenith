/**
 * EvidenceScorer - Phase 6G Advanced Intelligence
 * Automated evidence evaluation and strength scoring service
 */

// Types
export interface EvidenceItem {
  id: string;
  name: string;
  type: 'document' | 'transaction' | 'communication' | 'digital' | 'physical' | 'testimonial';
  source: string;
  dateObtained: Date;
  chainOfCustody: CustodyRecord[];
  metadata: Record<string, unknown>;
}

export interface CustodyRecord {
  timestamp: Date;
  handler: string;
  action: 'obtained' | 'transferred' | 'analyzed' | 'stored';
  notes?: string;
}

export interface EvidenceScore {
  evidenceId: string;
  overallScore: number;
  components: ScoreComponent[];
  admissibilityRating: 'high' | 'medium' | 'low' | 'inadmissible';
  strengthIndicators: StrengthIndicator[];
  weaknesses: string[];
  recommendations: string[];
  legalNotes: string[];
}

export interface ScoreComponent {
  category: 'authenticity' | 'reliability' | 'relevance' | 'probative' | 'chain_of_custody' | 'corroboration';
  score: number;
  maxScore: number;
  factors: ScoringFactor[];
}

export interface ScoringFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface StrengthIndicator {
  type: 'corroborating' | 'direct' | 'circumstantial' | 'documentary' | 'expert';
  description: string;
  confidence: number;
}

export interface ScoringCriteria {
  authenticityWeight: number;
  reliabilityWeight: number;
  relevanceWeight: number;
  probativeWeight: number;
  chainOfCustodyWeight: number;
  corroborationWeight: number;
}

// Default scoring criteria
const DEFAULT_CRITERIA: ScoringCriteria = {
  authenticityWeight: 0.20,
  reliabilityWeight: 0.20,
  relevanceWeight: 0.15,
  probativeWeight: 0.20,
  chainOfCustodyWeight: 0.15,
  corroborationWeight: 0.10
};

// Evidence type base scores
const TYPE_BASE_SCORES: Record<EvidenceItem['type'], number> = {
  document: 85,
  transaction: 90,
  communication: 75,
  digital: 80,
  physical: 95,
  testimonial: 60
};

/**
 * Main Evidence Scoring Engine
 */
export class EvidenceScorer {
  private criteria: ScoringCriteria;

  constructor(criteria: ScoringCriteria = DEFAULT_CRITERIA) {
    this.criteria = criteria;
  }

  /**
   * Score a single piece of evidence
   */
  scoreEvidence(evidence: EvidenceItem, context?: {
    relatedEvidence?: EvidenceItem[];
    caseHypotheses?: string[];
    legalJurisdiction?: string;
  }): EvidenceScore {
    const components: ScoreComponent[] = [
      this.scoreAuthenticity(evidence),
      this.scoreReliability(evidence),
      this.scoreRelevance(evidence, context?.caseHypotheses),
      this.scoreProbativeValue(evidence),
      this.scoreChainOfCustody(evidence),
      this.scoreCorroboration(evidence, context?.relatedEvidence)
    ];

    const overallScore = this.calculateOverallScore(components);
    const admissibilityRating = this.determineAdmissibility(components, overallScore);
    const strengthIndicators = this.identifyStrengths(evidence, components);
    const weaknesses = this.identifyWeaknesses(components);
    const recommendations = this.generateRecommendations(components, weaknesses);
    const legalNotes = this.generateLegalNotes(evidence, admissibilityRating, context?.legalJurisdiction);

    return {
      evidenceId: evidence.id,
      overallScore,
      components,
      admissibilityRating,
      strengthIndicators,
      weaknesses,
      recommendations,
      legalNotes
    };
  }

  /**
   * Score multiple pieces of evidence and analyze relationships
   */
  scoreBatch(evidenceList: EvidenceItem[], context?: {
    caseHypotheses?: string[];
    legalJurisdiction?: string;
  }): {
    scores: EvidenceScore[];
    aggregateScore: number;
    corroborationMatrix: Map<string, Map<string, number>>;
    overallStrength: 'strong' | 'moderate' | 'weak';
  } {
    const scores = evidenceList.map(ev => 
      this.scoreEvidence(ev, { ...context, relatedEvidence: evidenceList.filter(e => e.id !== ev.id) })
    );

    const aggregateScore = scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
    const corroborationMatrix = this.buildCorroborationMatrix(evidenceList);
    const overallStrength = aggregateScore >= 80 ? 'strong' : aggregateScore >= 60 ? 'moderate' : 'weak';

    return { scores, aggregateScore, corroborationMatrix, overallStrength };
  }

  // Private scoring methods

  private scoreAuthenticity(evidence: EvidenceItem): ScoreComponent {
    const factors: ScoringFactor[] = [];
    let score = TYPE_BASE_SCORES[evidence.type];

    // Check metadata completeness
    const metadataKeys = Object.keys(evidence.metadata);
    if (metadataKeys.length >= 5) {
      factors.push({
        name: 'Complete Metadata',
        impact: 'positive',
        weight: 10,
        description: 'Evidence contains comprehensive metadata'
      });
      score += 5;
    } else if (metadataKeys.length < 2) {
      factors.push({
        name: 'Sparse Metadata',
        impact: 'negative',
        weight: 10,
        description: 'Limited metadata may affect authenticity verification'
      });
      score -= 10;
    }

    // Source credibility
    if (evidence.source.includes('official') || evidence.source.includes('government')) {
      factors.push({
        name: 'Official Source',
        impact: 'positive',
        weight: 15,
        description: 'Evidence obtained from official or government source'
      });
      score += 10;
    }

    return {
      category: 'authenticity',
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      factors
    };
  }

  private scoreReliability(evidence: EvidenceItem): ScoreComponent {
    const factors: ScoringFactor[] = [];
    let score = 70;

    // Evidence type reliability
    if (['transaction', 'digital', 'document'].includes(evidence.type)) {
      factors.push({
        name: 'Objective Evidence Type',
        impact: 'positive',
        weight: 15,
        description: 'Evidence type is generally more reliable and less subject to interpretation'
      });
      score += 15;
    }

    // Recency
    const ageInDays = (Date.now() - evidence.dateObtained.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 30) {
      factors.push({
        name: 'Recently Obtained',
        impact: 'positive',
        weight: 10,
        description: 'Evidence obtained within last 30 days'
      });
      score += 10;
    } else if (ageInDays > 365) {
      factors.push({
        name: 'Aged Evidence',
        impact: 'negative',
        weight: 5,
        description: 'Evidence may be subject to degradation or obsolescence concerns'
      });
      score -= 5;
    }

    return {
      category: 'reliability',
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      factors
    };
  }

  private scoreRelevance(evidence: EvidenceItem, hypotheses?: string[]): ScoreComponent {
    const factors: ScoringFactor[] = [];
    let score = 75;

    // Base relevance by type
    if (['transaction', 'document'].includes(evidence.type)) {
      factors.push({
        name: 'Primary Evidence Type',
        impact: 'positive',
        weight: 10,
        description: 'Evidence type typically directly relevant to financial investigations'
      });
      score += 10;
    }

    // Hypothesis connection (if provided)
    if (hypotheses && hypotheses.length > 0) {
      factors.push({
        name: 'Hypothesis Linkage',
        impact: 'positive',
        weight: 15,
        description: `Evidence may support ${hypotheses.length} case hypothesis(es)`
      });
      score += 5 * Math.min(hypotheses.length, 3);
    }

    return {
      category: 'relevance',
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      factors
    };
  }

  private scoreProbativeValue(evidence: EvidenceItem): ScoreComponent {
    const factors: ScoringFactor[] = [];
    let score = 70;

    // Direct vs circumstantial
    if (['transaction', 'document', 'digital'].includes(evidence.type)) {
      factors.push({
        name: 'Direct Evidence',
        impact: 'positive',
        weight: 20,
        description: 'Evidence directly demonstrates facts at issue'
      });
      score += 15;
    } else {
      factors.push({
        name: 'Circumstantial Evidence',
        impact: 'neutral',
        weight: 10,
        description: 'Evidence requires inference to connect to facts at issue'
      });
    }

    return {
      category: 'probative',
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      factors
    };
  }

  private scoreChainOfCustody(evidence: EvidenceItem): ScoreComponent {
    const factors: ScoringFactor[] = [];
    const custody = evidence.chainOfCustody;
    let score = 50;

    // Check custody record completeness
    if (custody.length >= 3) {
      factors.push({
        name: 'Complete Custody Chain',
        impact: 'positive',
        weight: 25,
        description: 'Evidence has comprehensive chain of custody documentation'
      });
      score += 30;
    } else if (custody.length === 0) {
      factors.push({
        name: 'No Custody Records',
        impact: 'negative',
        weight: 40,
        description: 'Missing chain of custody documentation'
      });
      score -= 30;
    }

    // Check for gaps
    if (custody.length >= 2) {
      const sorted = [...custody].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      let hasGaps = false;
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].timestamp.getTime() - sorted[i-1].timestamp.getTime();
        if (gap > 7 * 24 * 60 * 60 * 1000) { // 7 days
          hasGaps = true;
          break;
        }
      }
      
      if (!hasGaps) {
        factors.push({
          name: 'Continuous Custody',
          impact: 'positive',
          weight: 15,
          description: 'No significant gaps in custody documentation'
        });
        score += 15;
      }
    }

    return {
      category: 'chain_of_custody',
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      factors
    };
  }

  private scoreCorroboration(evidence: EvidenceItem, relatedEvidence?: EvidenceItem[]): ScoreComponent {
    const factors: ScoringFactor[] = [];
    let score = 60;

    if (!relatedEvidence || relatedEvidence.length === 0) {
      factors.push({
        name: 'Standalone Evidence',
        impact: 'neutral',
        weight: 0,
        description: 'No related evidence available for corroboration analysis'
      });
      return { category: 'corroboration', score, maxScore: 100, factors };
    }

    // Count evidence of same type (potential corroboration)
    const sameTypeCount = relatedEvidence.filter(e => e.type === evidence.type).length;
    if (sameTypeCount >= 2) {
      factors.push({
        name: 'Multiple Corroborating Sources',
        impact: 'positive',
        weight: 20,
        description: `${sameTypeCount} other evidence items of same type may corroborate`
      });
      score += Math.min(25, sameTypeCount * 8);
    }

    // Cross-type corroboration
    const crossTypeCount = relatedEvidence.filter(e => e.type !== evidence.type).length;
    if (crossTypeCount >= 1) {
      factors.push({
        name: 'Cross-Type Corroboration',
        impact: 'positive',
        weight: 15,
        description: 'Evidence from different sources/types available for cross-validation'
      });
      score += 10;
    }

    return {
      category: 'corroboration',
      score: Math.min(100, Math.max(0, score)),
      maxScore: 100,
      factors
    };
  }

  private calculateOverallScore(components: ScoreComponent[]): number {
    const weights = {
      authenticity: this.criteria.authenticityWeight,
      reliability: this.criteria.reliabilityWeight,
      relevance: this.criteria.relevanceWeight,
      probative: this.criteria.probativeWeight,
      chain_of_custody: this.criteria.chainOfCustodyWeight,
      corroboration: this.criteria.corroborationWeight
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const component of components) {
      const weight = weights[component.category] || 0;
      weightedSum += component.score * weight;
      totalWeight += weight;
    }

    return Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);
  }

  private determineAdmissibility(components: ScoreComponent[], overallScore: number): EvidenceScore['admissibilityRating'] {
    const chainOfCustody = components.find(c => c.category === 'chain_of_custody');
    const authenticity = components.find(c => c.category === 'authenticity');

    // Critical factors that can make evidence inadmissible
    if ((chainOfCustody?.score || 0) < 30 || (authenticity?.score || 0) < 40) {
      return 'inadmissible';
    }

    if (overallScore >= 80) return 'high';
    if (overallScore >= 60) return 'medium';
    return 'low';
  }

  private identifyStrengths(evidence: EvidenceItem, components: ScoreComponent[]): StrengthIndicator[] {
    const strengths: StrengthIndicator[] = [];

    // Check for high-scoring components
    for (const component of components) {
      if (component.score >= 85) {
        strengths.push({
          type: 'documentary',
          description: `Strong ${component.category.replace('_', ' ')} score (${component.score}/100)`,
          confidence: component.score
        });
      }
    }

    // Type-specific strengths
    if (evidence.type === 'transaction') {
      strengths.push({
        type: 'direct',
        description: 'Transaction records provide direct evidence of financial activity',
        confidence: 90
      });
    }

    return strengths;
  }

  private identifyWeaknesses(components: ScoreComponent[]): string[] {
    const weaknesses: string[] = [];

    for (const component of components) {
      if (component.score < 60) {
        weaknesses.push(`Weak ${component.category.replace('_', ' ')} (${component.score}/100)`);
      }
      
      for (const factor of component.factors) {
        if (factor.impact === 'negative') {
          weaknesses.push(factor.description);
        }
      }
    }

    return weaknesses;
  }

  private generateRecommendations(components: ScoreComponent[], weaknesses: string[]): string[] {
    const recommendations: string[] = [];

    const chainOfCustody = components.find(c => c.category === 'chain_of_custody');
    if ((chainOfCustody?.score || 0) < 70) {
      recommendations.push('Document and verify chain of custody for all evidence handlers');
    }

    const corroboration = components.find(c => c.category === 'corroboration');
    if ((corroboration?.score || 0) < 70) {
      recommendations.push('Seek additional corroborating evidence from independent sources');
    }

    if (weaknesses.length > 0) {
      recommendations.push('Address identified weaknesses before presenting evidence in legal proceedings');
    }

    return recommendations;
  }

  private generateLegalNotes(
    evidence: EvidenceItem, 
    admissibility: EvidenceScore['admissibilityRating'],
    _jurisdiction?: string
  ): string[] {
    const notes: string[] = [];

    if (admissibility === 'inadmissible') {
      notes.push('WARNING: Evidence may face significant admissibility challenges');
    }

    if (evidence.type === 'digital') {
      notes.push('Digital evidence should be authenticated per FRE 901(b)(9) or equivalent');
    }

    if (evidence.type === 'testimonial') {
      notes.push('Testimonial evidence subject to hearsay rules - confirm exceptions apply');
    }

    return notes;
  }

  private buildCorroborationMatrix(
    evidenceList: EvidenceItem[]
  ): Map<string, Map<string, number>> {
    const matrix = new Map<string, Map<string, number>>();

    for (const ev1 of evidenceList) {
      const row = new Map<string, number>();
      for (const ev2 of evidenceList) {
        if (ev1.id === ev2.id) {
          row.set(ev2.id, 100);
        } else {
          // Simple corroboration score based on type matching and source diversity
          let score = 50;
          if (ev1.type === ev2.type) score += 20;
          if (ev1.source !== ev2.source) score += 15; // Different sources = better
          row.set(ev2.id, score);
        }
      }
      matrix.set(ev1.id, row);
    }

    return matrix;
  }
}

export default EvidenceScorer;
