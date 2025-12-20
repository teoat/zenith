import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCaseStore } from '../caseStore';

describe('caseStore', () => {
  beforeEach(() => {
    useCaseStore.setState({
      cases: [],
      selectedCase: null,
      filter: {},
      isLoading: false,
      error: null
    });
  });

  describe('cases management', () => {
    it('should set cases', () => {
      const { result } = renderHook(() => useCaseStore());

      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
        { id: '2', title: 'Case 2', status: 'closed', priority: 'low' }
      ];

      act(() => {
        result.current.setCases(mockCases);
      });

      expect(result.current.cases).toEqual(mockCases);
    });

    it('should add a case', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Case 1', status: 'open', priority: 'high' }
        ]);
      });

      const newCase = { id: '2', title: 'Case 2', status: 'open', priority: 'medium' };

      act(() => {
        result.current.addCase(newCase);
      });

      expect(result.current.cases).toHaveLength(2);
      expect(result.current.cases).toContainEqual(newCase);
    });

    it('should update a case', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Original Title', status: 'open', priority: 'high' }
        ]);
      });

      act(() => {
        result.current.updateCase('1', { title: 'Updated Title', status: 'closed' });
      });

      expect(result.current.cases[0].title).toBe('Updated Title');
      expect(result.current.cases[0].status).toBe('closed');
    });

    it('should delete a case', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
          { id: '2', title: 'Case 2', status: 'open', priority: 'medium' }
        ]);
      });

      act(() => {
        result.current.deleteCase('1');
      });

      expect(result.current.cases).toHaveLength(1);
      expect(result.current.cases[0].id).toBe('2');
    });
  });

  describe('case selection', () => {
    it('should select a case', () => {
      const { result } = renderHook(() => useCaseStore());

      const selectedCase = { id: '1', title: 'Selected Case', status: 'open', priority: 'high' };

      act(() => {
        result.current.selectCase(selectedCase);
      });

      expect(result.current.selectedCase).toEqual(selectedCase);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.selectCase({ id: '1', title: 'Case', status: 'open', priority: 'high' });
      });

      expect(result.current.selectedCase).toBeTruthy();

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedCase).toBeNull();
    });
  });

  describe('filtering', () => {
    it('should set filter', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setFilter({ status: 'open', priority: 'high' });
      });

      expect(result.current.filter).toEqual({ status: 'open', priority: 'high' });
    });

    it('should clear filter', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setFilter({ status: 'open' });
      });

      expect(result.current.filter).toEqual({ status: 'open' });

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter).toEqual({});
    });

    it('should get filtered cases', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Open Case', status: 'open', priority: 'high' },
          { id: '2', title: 'Closed Case', status: 'closed', priority: 'low' },
          { id: '3', title: 'Open Case 2', status: 'open', priority: 'medium' }
        ]);
        result.current.setFilter({ status: 'open' });
      });

      const filtered = result.current.getFilteredCases();

      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.status === 'open')).toBe(true);
    });
  });

  describe('sorting', () => {
    it('should sort cases by date', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Case 1', created_at: '2025-01-03', status: 'open', priority: 'high' },
          { id: '2', title: 'Case 2', created_at: '2025-01-01', status: 'open', priority: 'high' },
          { id: '3', title: 'Case 3', created_at: '2025-01-02', status: 'open', priority: 'high' }
        ]);
      });

      const sorted = result.current.getSortedCases('date', 'desc');

      expect(sorted[0].id).toBe('1'); // Latest first
      expect(sorted[2].id).toBe('2'); // Oldest last
    });

    it('should sort cases by priority', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Low Priority', priority: 'low', status: 'open' },
          { id: '2', title: 'High Priority', priority: 'high', status: 'open' },
          { id: '3', title: 'Medium Priority', priority: 'medium', status: 'open' }
        ]);
      });

      const sorted = result.current.getSortedCases('priority', 'desc');

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
    });
  });

  describe('loading and error states', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set error', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setError('Failed to load cases');
      });

      expect(result.current.error).toBe('Failed to load cases');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setError('Error');
      });

      expect(result.current.error).toBe('Error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('bulk operations', () => {
    it('should update multiple cases', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
          { id: '2', title: 'Case 2', status: 'open', priority: 'high' },
          { id: '3', title: 'Case 3', status: 'open', priority: 'high' }
        ]);
      });

      act(() => {
        result.current.bulkUpdate(['1', '2'], { status: 'closed' });
      });

      const closedCases = result.current.cases.filter(c => c.status === 'closed');
      expect(closedCases).toHaveLength(2);
      expect(result.current.cases[2].status).toBe('open'); // Unchanged
    });

    it('should delete multiple cases', () => {
      const { result } = renderHook(() => useCaseStore());

      act(() => {
        result.current.setCases([
          { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
          { id: '2', title: 'Case 2', status: 'open', priority: 'high' },
          { id: '3', title: 'Case 3', status: 'open', priority: 'high' }
        ]);
      });

      act(() => {
        result.current.bulkDelete(['1', '3']);
      });

      expect(result.current.cases).toHaveLength(1);
      expect(result.current.cases[0].id).toBe('2');
    });
  });
});
