import { request, isElectron, API_BASE, getToken } from './client';
import { EvidenceItem, ProcessedEvidence, FileSelectResult } from '../types/api';

export const evidenceService = {
  getEvidence: async (caseId?: string): Promise<EvidenceItem[]> => {
    const query = caseId ? `?case_id=${caseId}` : '';
    return request(`/evidence${query}`);
  },

  uploadEvidence: async (caseId: string, file: File): Promise<EvidenceItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', caseId);
    
    const token = getToken();
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE}/evidence/upload`, {
      method: 'POST',
      body: formData,
      headers
    });
    
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  processEvidence: async (filePath: string): Promise<ProcessedEvidence> => {
    if (isElectron() && (window as any).electronAPI?.processEvidence) {
      return (window as any).electronAPI.processEvidence(filePath);
    }
    // Browser fallback - mock response
    return { fileType: 'unknown', sizeBytes: 0 };
  },

  analyzeFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Default options
    formData.append('enable_ocr', 'true');
    formData.append('enable_forensics', 'true');

    const token = getToken();
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE}/multimodal/analyze/upload`, {
      method: 'POST',
      body: formData,
      headers
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
    }
    return response.json();
  },

  selectFile: async (): Promise<FileSelectResult> => {
    if (isElectron() && (window as any).electronAPI?.selectFile) {
      return (window as any).electronAPI.selectFile();
    }
    // Browser fallback - use file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = () => resolve({ filePaths: input.files ? [input.files[0].name] : [] });
      input.click();
    });
  }
};
