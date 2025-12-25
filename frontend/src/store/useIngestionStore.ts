import { create } from 'zustand';
import type { TableData } from '../types/api';

export interface ProcessedFileData {
  fileType: string;
  sizeBytes: number;
  ocrText?: string;
  extracted_tables?: TableData[];
  document_type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bank_statement_data?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expense_data?: Record<string, any>;
}

export interface ProcessingResult {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused' | 'cancelled';
  progress: number;
  result?: ProcessedFileData;
  error?: string;
  isPaused: boolean;
  isCancellable: boolean;
  isSaved?: boolean;
  savedId?: string;
  mappingConfig?: Record<string, string>;
  detectedHeaders?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawPreviewData?: any[];
}

interface IngestionState {
  files: File[];
  processingResults: ProcessingResult[];
  isProcessing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  
  setFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  setProcessingResults: (results: ProcessingResult[] | ((prev: ProcessingResult[]) => ProcessingResult[])) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFilters: (filters: Record<string, any>) => void;
  updateProcessingResult: (index: number, updates: Partial<ProcessingResult>) => void;
  reset: () => void;
}

export const useIngestionStore = create<IngestionState>((set) => ({
  files: [],
  processingResults: [],
  isProcessing: false,
  filters: {},

  setFiles: (files) => set({ files }),
  addFiles: (newFiles) => set((state) => ({ files: [...state.files, ...newFiles] })),
  
  setProcessingResults: (updater) => set((state) => {
    const newResults = typeof updater === 'function' ? updater(state.processingResults) : updater;
    return { processingResults: newResults };
  }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setFilters: (filters) => set({ filters }),
  
  updateProcessingResult: (index, updates) => set((state) => {
    const newResults = [...state.processingResults];
    if (newResults[index]) {
      newResults[index] = { ...newResults[index], ...updates };
    }
    return { processingResults: newResults };
  }),

  reset: () => set({
    files: [],
    processingResults: [],
    isProcessing: false,
    filters: {}
  })
}));
