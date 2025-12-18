/**
 * DraftPreviewService - Service for managing collaborative draft states
 * 
 * Handles ephemeral draft states for case fields and investigation data.
 * Useful for AI auto-fill and multi-user presence.
 */

export interface DraftState {
  id: string;
  field: string;
  value: any;
  originalValue: any;
  lastModified: number;
  modifiedBy: string;
  status: 'draft' | 'proposed' | 'accepted' | 'rejected';
  reasoning?: string;
}

class DraftPreviewService {
  private drafts: Map<string, DraftState[]> = new Map();
  private listeners: Set<(entityId: string, drafts: DraftState[]) => void> = new Set();

  /**
   * Get all drafts for an entity
   */
  getDrafts(entityId: string): DraftState[] {
    return this.drafts.get(entityId) || [];
  }

  /**
   * Add or update a draft
   */
  setDraft(entityId: string, draft: Omit<DraftState, 'lastModified'>): void {
    const existingDrafts = this.getDrafts(entityId);
    const index = existingDrafts.findIndex(d => d.field === draft.field);
    
    const newDraft: DraftState = {
      ...draft,
      lastModified: Date.now(),
    };

    if (index >= 0) {
      existingDrafts[index] = newDraft;
    } else {
      existingDrafts.push(newDraft);
    }

    this.drafts.set(entityId, existingDrafts);
    this.notifyListeners(entityId);
  }

  /**
   * Propose a change from AI
   */
  proposeAIChange(entityId: string, field: string, value: any, originalValue: any, reasoning: string): void {
    this.setDraft(entityId, {
      id: `ai_${Date.now()}`,
      field,
      value,
      originalValue,
      modifiedBy: 'AI Assistant',
      status: 'proposed',
      reasoning
    });
  }

  /**
   * Accept a draft
   */
  acceptDraft(entityId: string, field: string): DraftState | null {
    const drafts = this.getDrafts(entityId);
    const index = drafts.findIndex(d => d.field === field);
    
    if (index >= 0) {
      const draft = drafts[index];
      draft.status = 'accepted';
      // In a real app, this would trigger an API call to save the data
      drafts.splice(index, 1);
      this.drafts.set(entityId, drafts);
      this.notifyListeners(entityId);
      return draft;
    }
    return null;
  }

  /**
   * Reject a draft
   */
  rejectDraft(entityId: string, field: string): void {
    const drafts = this.getDrafts(entityId);
    const index = drafts.findIndex(d => d.field === field);
    
    if (index >= 0) {
      drafts.splice(index, 1);
      this.drafts.set(entityId, drafts);
      this.notifyListeners(entityId);
    }
  }

  /**
   * Clear all drafts for an entity
   */
  clearDrafts(entityId: string): void {
    this.drafts.delete(entityId);
    this.notifyListeners(entityId);
  }

  /**
   * Subscribe to draft changes
   */
  addListener(callback: (entityId: string, drafts: DraftState[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(entityId: string): void {
    const drafts = this.getDrafts(entityId);
    this.listeners.forEach(listener => listener(entityId, drafts));
  }
}

export const draftPreviewService = new DraftPreviewService();
export default draftPreviewService;
