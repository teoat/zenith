import { request } from './client';
import { Case } from '../types/schema';
import { PaginationInfo } from '../types/api';

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

  getCaseNotes: async (caseId: string): Promise<{ notes: any[] }> => {
    return request(`/cases/${caseId}/notes`);
  },

  addCaseNote: async (caseId: string, note: { title: string; content: string; tags: string[] }): Promise<{ note: any }> => {
    return request(`/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note)
    });
  },

  updateCaseNote: async (caseId: string, noteId: string, note: { title: string; content: string; tags: string[] }): Promise<{ note: any }> => {
    return request(`/cases/${caseId}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(note)
    });
  },

  deleteCaseNote: async (caseId: string, noteId: string): Promise<{ message: string }> => {
    return request(`/cases/${caseId}/notes/${noteId}`, {
      method: 'DELETE'
    });
  }
};
