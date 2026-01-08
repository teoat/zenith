import { TableData } from './api';

export interface ProcessedFileData {
  fileType: string;
  sizeBytes: number;
  ocrText?: string;
  extracted_tables?: TableData[];
  document_type?: string;
  bank_statement_data?: Record<string, any>;
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
}
