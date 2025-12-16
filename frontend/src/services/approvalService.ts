/**
 * ApprovalService - Service for managing AI agent approval workflows
 * 
 * Handles pending actions, approval/rejection, and integration with AI workflows.
 */

import { api } from '../lib/api';

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'external_api' | 'financial';
  category: string;
  title: string;
  description: string;
  proposedBy: 'agent' | 'system';
  timestamp: Date;
  impact: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
  previewData?: string;
  aiReasoning?: string;
  confidence?: number;
}

export interface ApprovalDecision {
  actionId: string;
  approved: boolean;
  reason?: string;
  timestamp: Date;
  userId?: string;
}

class ApprovalService {
  private pendingActions: Map<string, PendingAction> = new Map();
  private listeners: Set<(actions: PendingAction[]) => void> = new Set();

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      // In production, fetch from backend
      // const response = await api.get('/approvals/pending');
      // return response.data;
      
      // For now, return local state
      return Array.from(this.pendingActions.values());
    } catch (error) {
      console.error('Failed to fetch pending actions:', error);
      return [];
    }
  }

  /**
   * Add a new pending action
   */
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<PendingAction> {
    const newAction: PendingAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.pendingActions.set(newAction.id, newAction);
    this.notifyListeners();

    // In production, send to backend
    // await api.post('/approvals/pending', newAction);

    return newAction;
  }

  /**
   * Approve an action
   */
  async approveAction(actionId: string, userId?: string): Promise<void> {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    const decision: ApprovalDecision = {
      actionId,
      approved: true,
      timestamp: new Date(),
      userId,
    };

    // Execute the approved action
    await this.executeAction(action);

    // Remove from pending
    this.pendingActions.delete(actionId);
    this.notifyListeners();

    // In production, send to backend
    // await api.post('/approvals/approve', decision);
  }

  /**
   * Reject an action
   */
  async rejectAction(actionId: string, reason?: string, userId?: string): Promise<void> {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    const decision: ApprovalDecision = {
      actionId,
      approved: false,
      reason,
      timestamp: new Date(),
      userId,
    };

    // Remove from pending
    this.pendingActions.delete(actionId);
    this.notifyListeners();

    // In production, send to backend
    // await api.post('/approvals/reject', decision);
  }

  /**
   * Execute an approved action
   */
  private async executeAction(action: PendingAction): Promise<void> {
    console.log(`[ApprovalService] Executing action: ${action.type} - ${action.title}`);
    
    try {
      switch (action.type) {
        case 'create':
          // Execute create action
          break;
        case 'update':
          // Execute update action
          break;
        case 'delete':
          // Execute delete action
          break;
        case 'external_api':
          // Execute external API call
          break;
        case 'financial':
          // Execute financial transaction
          break;
      }
    } catch (error) {
      console.error(`[ApprovalService] Failed to execute action ${action.id}:`, error);
      throw error;
    }
  }

  /**
   * Add listener for pending actions changes
   */
  addListener(callback: (actions: PendingAction[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const actions = Array.from(this.pendingActions.values());
    this.listeners.forEach(listener => listener(actions));
  }

  /**
   * Create action from AI suggestion
   */
  async createFromAISuggestion(
    suggestion: {
      type: PendingAction['type'];
      title: string;
      description: string;
      details?: Record<string, unknown>;
      reasoning?: string;
      confidence?: number;
    }
  ): Promise<PendingAction> {
    const impact = this.calculateImpact(suggestion.type, suggestion.details);
    
    return this.addPendingAction({
      type: suggestion.type,
      category: this.getCategoryFromType(suggestion.type),
      title: suggestion.title,
      description: suggestion.description,
      proposedBy: 'agent',
      impact,
      details: suggestion.details,
      aiReasoning: suggestion.reasoning,
      confidence: suggestion.confidence,
    });
  }

  /**
   * Calculate impact level based on action type and details
   */
  private calculateImpact(
    type: PendingAction['type'],
    details?: Record<string, unknown>
  ): PendingAction['impact'] {
    // High-stakes actions
    if (type === 'delete' || type === 'financial') return 'critical';
    if (type === 'external_api') return 'high';
    
    // Check details for high-value items
    if (details?.value && typeof details.value === 'number' && details.value > 10000) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Get category from action type
   */
  private getCategoryFromType(type: PendingAction['type']): string {
    const categories: Record<PendingAction['type'], string> = {
      create: 'Data Creation',
      update: 'Data Modification',
      delete: 'Data Deletion',
      external_api: 'External Integration',
      financial: 'Financial Transaction',
    };
    return categories[type];
  }
}

export const approvalService = new ApprovalService();
export default approvalService;
