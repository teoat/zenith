import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { useCases } from '@/useCases';

jest.mock('../../services/cases');

describe('useCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCases());
      
      expect(result.current.cases).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should load cases on mount', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      const { result, waitFor } = renderHook(() => useCases());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cases).toEqual(mockCases);
    });
  });

  describe('createCase', () => {
    it('should create new case', async () => {
      const newCase = {
        title: 'New Case',
        priority: 'high' as const,
        description: 'Test'
      };

      const mockCreated = { ...newCase, id: 'new-1', status: 'open' };

      const { caseService } = await import('../../services/cases');
      (caseService.createCase as jest.Mock).mockResolvedValue(mockCreated);

      const { result } = renderHook(() => useCases());

      await act(async () => {
        await result.current.createCase(newCase);
      });

      expect(caseService.createCase).toHaveBeenCalledWith(newCase);
    });
  });

  describe('updateCase', () => {
    it('should update existing case', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.updateCase as jest.Mock).mockResolvedValue({
        id: '1',
        status: 'closed'
      });

      const { result } = renderHook(() => useCases());

      await act(async () => {
        await result.current.updateCase('1', { status: 'closed' });
      });

      expect(caseService.updateCase).toHaveBeenCalledWith('1', { status: 'closed' });
    });
  });

  describe('deleteCase', () => {
    it('should delete case', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.deleteCase as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCases());

      await act(async () => {
        await result.current.deleteCase('1');
      });

      expect(caseService.deleteCase).toHaveBeenCalledWith('1');
    });
  });

  describe('error handling', () => {
    it('should handle load errors', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockRejectedValue(
        new Error('Failed to load')
      );

      const { result, waitFor } = renderHook(() => useCases());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('refresh', () => {
    it('should refresh cases', async () => {
      const mockCases = [{ id: '1', title: 'Case 1', status: 'open', priority: 'high' }];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      const { result, waitFor } = renderHook(() => useCases());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.refresh();
      });

      expect(caseService.getAllCases).toHaveBeenCalledTimes(2);
    });
  });
});
