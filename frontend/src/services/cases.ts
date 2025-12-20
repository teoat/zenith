import type { Note } from '../types/note';
import { request } from './client';
import type { Case } from '../types/schema';
import type { PaginationInfo } from '../types/api';

export const caseService = {
  getCases: async (params?: Record<string, unknown>): Promise<{ cases: Case[]; pagination: PaginationInfo }> => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request(`/cases${query}`);
  },

  getCase: async (caseId: string): Promise<{ case: Case }> => {
    return request(`/cases/${caseId}`);
  },

  createCase: async (caseData: Partial<Case>): Promise<{ id: string; case: Case }> => {
    return request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  },

  updateCase: async (caseId: string, data: Partial<Case>): Promise<{ case: Case }> => {
    return request(`/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCase: async (caseId: string): Promise<{ message: string }> => {
    return request(`/cases/${caseId}`, { method: 'DELETE' });
  },

  getCaseNotes: async (caseId: string): Promise<{ notes: Note[] }> => {
    return request(`/cases/${caseId}/notes`);
  },

  addCaseNote: async (caseId: string, note: { title: string; content: string; tags: string[] }): Promise<{ note: Note }> => {
    return request(`/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note)
    });
  },

  updateCaseNote: async (caseId: string, noteId: string, note: { title: string; content: string; tags: string[] }): Promise<{ note: Note }> => {
    return request(`/cases/${caseId}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(note)
    });
  },

  deleteCaseNote: async (caseId: string, noteId: string): Promise<{ message: string }> => {
    return request(`/cases/${caseId}/notes/${noteId}`, {
      method: 'DELETE'
    });
  },

  getAllCases: async (params?: Record<string, unknown>): Promise<Case[]> => {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const result = await request(`/cases${query}`);
    // Handle both direct array response and object with cases property
    return Array.isArray(result) ? result : (result as any).cases || [];
  },

  getCaseStatistics: async (): Promise<{
    total: number;
    open: number;
    in_progress: number;
    closed: number;
    by_priority: { high: number; medium: number; low: number };
  }> => {
    return request('/stats/cases');
  }
};
