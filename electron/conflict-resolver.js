// electron/conflict-resolver.js
class ConflictResolver {
  constructor() {
    this.resolutionStrategies = {
      'last-write-wins': this.lastWriteWins.bind(this),
      'merge': this.mergeData.bind(this),
      'use-local': this.useLocal.bind(this),
      'use-remote': this.useRemote.bind(this),
      'manual': this.manualResolution.bind(this)
    };
  }

  async resolve(conflictData, resolutionStrategy = 'last-write-wins') {
    const strategy = this.resolutionStrategies[resolutionStrategy];

    if (!strategy) {
      throw new Error(`Unknown resolution strategy: ${resolutionStrategy}`);
    }

    return await strategy(conflictData);
  }

  async lastWriteWins(conflictData) {
    const { local, remote } = conflictData;

    // Compare timestamps
    const localTime = new Date(local.updatedAt || local.createdAt || 0);
    const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0);

    return remoteTime > localTime ? remote : local;
  }

  async mergeData(conflictData) {
    const { local, remote, type } = conflictData;

    switch (type) {
      case 'case-update-conflict':
        return this.mergeCaseData(local, remote);

      case 'transaction-conflict':
        return this.mergeTransactionData(local, remote);

      case 'evidence-conflict':
        return this.mergeEvidenceData(local, remote);

      default:
        // Default to last-write-wins for unknown types
        return this.lastWriteWins(conflictData);
    }
  }

  mergeCaseData(local, remote) {
    // Merge case data intelligently
    const merged = { ...remote }; // Start with remote as base

    // For certain fields, prefer local changes
    const preferLocalFields = ['status', 'priority', 'assignee_id'];

    for (const field of preferLocalFields) {
      if (local[field] !== undefined && local[field] !== remote[field]) {
        merged[field] = local[field];
        merged[`${field}_conflict_resolved`] = true;
      }
    }

    // For description/notes, append local changes
    if (local.description && remote.description &&
        local.description !== remote.description) {
      merged.description = `${remote.description}\n\n[Local changes merged]\n${local.description}`;
    }

    // Add merge metadata
    merged.mergedAt = new Date().toISOString();
    merged.mergeStrategy = 'intelligent-merge';
    merged.originalVersions = {
      local: { ...local },
      remote: { ...remote }
    };

    return merged;
  }

  mergeTransactionData(local, remote) {
    // For transactions, be more conservative
    // Usually last-write-wins is better for financial data
    return this.lastWriteWins({ local, remote });
  }

  mergeEvidenceData(local, remote) {
    // Evidence is usually append-only, so merge might not make sense
    // Prefer the version with more complete metadata
    const localCompleteness = this.calculateEvidenceCompleteness(local);
    const remoteCompleteness = this.calculateEvidenceCompleteness(remote);

    if (localCompleteness > remoteCompleteness) {
      return local;
    } else if (remoteCompleteness > localCompleteness) {
      return remote;
    } else {
      return this.lastWriteWins({ local, remote });
    }
  }

  calculateEvidenceCompleteness(evidence) {
    let score = 0;

    // Basic fields
    if (evidence.filename) score += 1;
    if (evidence.file_type) score += 1;
    if (evidence.size_bytes) score += 1;
    if (evidence.hash) score += 1;

    // Metadata fields
    if (evidence.ocr_text) score += 2;
    if (evidence.metadata) score += 1;
    if (evidence.exif) score += 1;

    // Processing status
    if (evidence.processing_completed) score += 1;

    return score;
  }

  async useLocal(conflictData) {
    return conflictData.local;
  }

  async useRemote(conflictData) {
    return conflictData.remote;
  }

  async manualResolution(conflictData) {
    // For manual resolution, return null to indicate
    // that the conflict needs user intervention
    return null;
  }

  // Advanced conflict resolution strategies

  async resolveWithRules(conflictData, rules) {
    // Apply custom business rules for conflict resolution
    const { local, remote, type } = conflictData;

    for (const rule of rules) {
      if (this.evaluateRule(rule, local, remote, type)) {
        return this.applyRuleAction(rule, local, remote);
      }
    }

    // If no rules apply, use default strategy
    return this.lastWriteWins(conflictData);
  }

  evaluateRule(rule, local, remote, type) {
    // Evaluate a business rule against the conflict
    const { condition, field, operator, value } = rule;

    let targetValue;
    switch (condition) {
      case 'local-field':
        targetValue = local[field];
        break;
      case 'remote-field':
        targetValue = remote[field];
        break;
      case 'type':
        targetValue = type;
        break;
      default:
        return false;
    }

    switch (operator) {
      case 'equals':
        return targetValue === value;
      case 'not-equals':
        return targetValue !== value;
      case 'greater-than':
        return targetValue > value;
      case 'less-than':
        return targetValue < value;
      case 'contains':
        return String(targetValue).includes(value);
      default:
        return false;
    }
  }

  applyRuleAction(rule, local, remote) {
    const { action, field, value } = rule;

    switch (action) {
      case 'use-local':
        return local;
      case 'use-remote':
        return remote;
      case 'set-field':
        return { ...remote, [field]: value };
      case 'merge-field':
        return { ...remote, [field]: `${remote[field] || ''}\n${local[field] || ''}`.trim() };
      default:
        return remote;
    }
  }

  // Conflict analysis and reporting

  analyzeConflict(conflictData) {
    const { local, remote, type } = conflictData;

    const analysis = {
      type,
      severity: this.calculateConflictSeverity(conflictData),
      differences: this.findDifferences(local, remote),
      recommendations: this.generateRecommendations(conflictData),
      riskAssessment: this.assessConflictRisk(conflictData)
    };

    return analysis;
  }

  calculateConflictSeverity(conflictData) {
    const { type } = conflictData;

    // Severity based on conflict type and potential impact
    const severityMap = {
      'case-exists': 'high', // Duplicate case creation
      'case-update-conflict': 'medium', // Case field conflicts
      'transaction-conflict': 'high', // Financial data conflicts
      'evidence-conflict': 'low', // Evidence metadata conflicts
      'duplicate-transaction': 'high' // Potential fraud indicator
    };

    return severityMap[type] || 'medium';
  }

  findDifferences(local, remote) {
    const differences = [];
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      const localValue = local[key];
      const remoteValue = remote[key];

      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        differences.push({
          field: key,
          local: localValue,
          remote: remoteValue,
          type: this.classifyDifference(localValue, remoteValue)
        });
      }
    }

    return differences;
  }

  classifyDifference(localValue, remoteValue) {
    if (localValue == null && remoteValue != null) return 'added-remotely';
    if (localValue != null && remoteValue == null) return 'added-locally';
    if (typeof localValue !== typeof remoteValue) return 'type-mismatch';

    if (typeof localValue === 'string' || typeof localValue === 'number') {
      return 'value-difference';
    }

    return 'complex-difference';
  }

  generateRecommendations(conflictData) {
    const { type, differences } = conflictData;
    const recommendations = [];

    switch (type) {
      case 'case-exists':
        recommendations.push({
          strategy: 'merge',
          reason: 'Combine case data from both sources',
          confidence: 'high'
        });
        break;

      case 'case-update-conflict':
        if (differences.some(d => d.field === 'status')) {
          recommendations.push({
            strategy: 'use-remote',
            reason: 'Status changes should be authoritative',
            confidence: 'medium'
          });
        }
        break;

      case 'transaction-conflict':
        recommendations.push({
          strategy: 'manual',
          reason: 'Financial data requires human review',
          confidence: 'high'
        });
        break;
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        strategy: 'last-write-wins',
        reason: 'Most recent change is likely correct',
        confidence: 'medium'
      });
    }

    return recommendations;
  }

  assessConflictRisk(conflictData) {
    const { type, differences } = conflictData;
    let riskLevel = 'low';
    let riskFactors = [];

    // High-risk conflict types
    if (['transaction-conflict', 'duplicate-transaction'].includes(type)) {
      riskLevel = 'high';
      riskFactors.push('Financial data integrity');
    }

    // High-risk fields
    const highRiskFields = ['amount', 'status', 'priority', 'assignee_id'];
    if (differences.some(d => highRiskFields.includes(d.field))) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      riskFactors.push('Critical field modification');
    }

    // Multiple differences increase risk
    if (differences.length > 3) {
      riskLevel = 'high';
      riskFactors.push('Multiple conflicting changes');
    }

    return {
      level: riskLevel,
      factors: riskFactors,
      requiresReview: riskLevel === 'high'
    };
  }

  // Batch conflict resolution
  async resolveBatchConflicts(conflicts, defaultStrategy = 'last-write-wins') {
    const results = [];

    for (const conflict of conflicts) {
      try {
        const resolved = await this.resolve(conflict, defaultStrategy);
        results.push({
          conflictId: conflict.id,
          success: true,
          resolved
        });
      } catch (error) {
        results.push({
          conflictId: conflict.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = ConflictResolver;