/**
 * File processing service for handling case imports from uploaded files.
 * Supports CSV, JSON, and other structured data formats for bulk case creation.
 */

import { api } from '@/lib/api';
import { errorReporting } from './errorReporting';
import { secureLogger } from '@/utils/secureLogger';

export interface ProcessedCase {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type?: 'FRAUD' | 'AML' | 'COMPLIANCE' | 'OTHER';
  tags?: string[];
}

export interface FileProcessingResult {
  success: boolean;
  casesCreated: number;
  errors: string[];
  processedCases: ProcessedCase[];
}

class FileProcessingService {
  private static instance: FileProcessingService;

  private constructor() {}

  static getInstance(): FileProcessingService {
    if (!FileProcessingService.instance) {
      FileProcessingService.instance = new FileProcessingService();
    }
    return FileProcessingService.instance;
  }

  async processCaseImportFiles(files: File[]): Promise<FileProcessingResult> {
    const result: FileProcessingResult = {
      success: true,
      casesCreated: 0,
      errors: [],
      processedCases: []
    };

    for (const file of files) {
      try {
        const fileResult = await this.processSingleFile(file);
        result.processedCases.push(...fileResult.cases);
        result.casesCreated += fileResult.cases.length;

        if (fileResult.errors.length > 0) {
          result.errors.push(...fileResult.errors.map(err => `${file.name}: ${err}`));
        }
      } catch (error: unknown) {
        const errorMessage = `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;

        errorReporting.reportError({
          message: errorMessage,
          component: 'FileProcessingService',
          severity: 'medium',
          context: { fileName: file.name, fileSize: file.size }
        });
      }
    }

    // Create cases in the backend
    if (result.processedCases.length > 0) {
      try {
        await this.createCasesInBackend(result.processedCases);
      } catch (error: unknown) {
        result.errors.push(`Failed to create cases in backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.success = false;
      }
    }

    return result;
  }

  private async processSingleFile(file: File): Promise<{ cases: ProcessedCase[], errors: string[] }> {
    const result = { cases: [] as ProcessedCase[], errors: [] as string[] };

    const fileExtension = file.name.toLowerCase().split('.').pop();

    switch (fileExtension) {
      case 'csv': {
        const csvResult = await this.processCSVFile(file);
        result.cases = csvResult.cases;
        result.errors = csvResult.errors;
        break;
      }

      case 'json': {
        const jsonResult = await this.processJSONFile(file);
        result.cases = jsonResult.cases;
        result.errors = jsonResult.errors;
        break;
      }

      case 'xlsx':
      case 'xls':
        result.errors.push('Excel file processing not yet implemented');
        break;

      default:
        result.errors.push(`Unsupported file type: ${fileExtension}`);
    }

    return result;
  }

  private async processCSVFile(file: File): Promise<{ cases: ProcessedCase[], errors: string[] }> {
    const result = { cases: [] as ProcessedCase[], errors: [] as string[] };

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        result.errors.push('CSV file must have at least a header row and one data row');
        return result;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Validate required columns
      const requiredColumns = ['title', 'description'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        return result;
      }

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          if (values.length === headers.length) {
            const caseData: ProcessedCase = {
              title: values[headers.indexOf('title')] || `Case ${i}`,
              description: values[headers.indexOf('description')] || '',
              priority: (values[headers.indexOf('priority')] as unknown as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM',
            };

            // Add optional fields
            const caseType = values[headers.indexOf('type')];
            if (caseType) {
              caseData.type = caseType as 'FRAUD' | 'AML' | 'COMPLIANCE' | 'OTHER';
            }

            const tags = values[headers.indexOf('tags')];
            if (tags) {
              caseData.tags = tags.split(',').map(tag => tag.trim());
            }

            result.cases.push(caseData);
          }
        } catch (error: unknown) {
          result.errors.push(`Error processing row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error: unknown) {
      result.errors.push(`Failed to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async processJSONFile(file: File): Promise<{ cases: ProcessedCase[], errors: string[] }> {
    const result = { cases: [] as ProcessedCase[], errors: [] as string[] };

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Handle both single case and array of cases
      const casesData = Array.isArray(data) ? data : [data];

      for (const caseData of casesData) {
        try {
          const processedCase: ProcessedCase = {
            title: caseData.title || 'Untitled Case',
            description: caseData.description || '',
            priority: (caseData.priority || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            type: caseData.type || 'FRAUD',
            tags: caseData.tags || []
          };

          result.cases.push(processedCase);
        } catch (error: unknown) { // Changed _error to error
          secureLogger.error('FILE_PROCESSING', 'Error processing case', {
            error: error instanceof Error ? error.message : String(error)
          }); // Added console.error
          // The original line was: result.errors.push(`Error processing case: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // The instruction `throw error; ? error.message : 'Unknown error'}`);` is syntactically incorrect.
          // Assuming the intent was to add `throw error;` and keep the error reporting.
          // Re-throwing here would stop the loop, so we'll add it after reporting.
          result.errors.push(`Error processing case: ${error instanceof Error ? error.message : 'Unknown error'}`);
          throw error; // Added throw error as per instruction, this will exit the loop and the function.
        }
      }
    } catch (error: unknown) { // Changed _error to error
      result.errors.push(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private parseCSVLine(line: string): string[] {
    // Simple CSV parser - handles basic quoted fields
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add final field
    result.push(current.trim());

    return result;
  }

  private async createCasesInBackend(cases: ProcessedCase[]): Promise<void> {
    // Create cases in batches to avoid overwhelming the API
    const batchSize = 10;

    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, i + batchSize);

      for (const caseData of batch) {
        try {
          await api.createCase({
            title: caseData.title,
            description: caseData.description,
            priority: caseData.priority,
            type: caseData.type,
            tags: caseData.tags
          });
        } catch (error: unknown) {
          errorReporting.reportApiError(error, 'createCase', 'POST');
          throw new Error(`Failed to create case "${caseData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Small delay between batches
      if (i + batchSize < cases.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

// Export singleton instance
export const fileProcessingService = FileProcessingService.getInstance();