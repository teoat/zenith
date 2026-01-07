import { create } from "zustand";
import type { TableData } from "@/types/api";

export interface ProcessedFileData {
  fileType: string;
  sizeBytes: number;
  ocrText?: string;
  extracted_tables?: TableData[];
  document_type?: string;
  bank_statement_data?: Record<string, unknown>;
  expense_data?: Record<string, unknown>;
}

export interface ProcessingResult {
  file: File;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "error"
    | "paused"
    | "cancelled";
  progress: number;
  result?: ProcessedFileData;
  error?: string;
  isPaused: boolean;
  isCancellable: boolean;
  isSaved?: boolean;
  savedId?: string;
  mappingConfig?: Record<string, string>;
  detectedHeaders?: string[];
  rawPreviewData?: unknown[];
}

interface IngestionState {
  files: File[];
  processingResults: ProcessingResult[];
  isProcessing: boolean;
  filters: Record<string, unknown>;

  setFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  setProcessingResults: (
    results:
      | ProcessingResult[]
      | ((prev: ProcessingResult[]) => ProcessingResult[]),
  ) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setFilters: (filters: Record<string, unknown>) => void;
  updateProcessingResult: (
    index: number,
    updates: Partial<ProcessingResult>,
  ) => void;
  reset: () => void;
}

export const useIngestionStore = create<IngestionState>((set) => ({
  files: [],
  processingResults: [],
  isProcessing: false,
  filters: {},

  setFiles: (files) => set({ files }),
  addFiles: (newFiles) =>
    set((state) => ({ files: [...state.files, ...newFiles] })),

  setProcessingResults: (updater) =>
    set((state) => {
      const newResults =
        typeof updater === "function"
          ? updater(state.processingResults)
          : updater;
      return { processingResults: newResults };
    }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setFilters: (filters) => set({ filters }),

  updateProcessingResult: (index, updates) =>
    set((state) => {
      const newResults = [...state.processingResults];
      if (newResults[index]) {
        newResults[index] = { ...newResults[index], ...updates };
      }
      return { processingResults: newResults };
    }),

  reset: () =>
    set({
      files: [],
      processingResults: [],
      isProcessing: false,
      filters: {},
    }),
}));
