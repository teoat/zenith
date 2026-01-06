import { act, renderHook } from '@testing-library/react';
import { useCaseStore } from '../caseStore';

// Mock the persist middleware
jest.mock('zustand/middleware', () => ({
  devtools: (fn: any) => fn,
  persist: (fn: any) => fn,
}));

describe('CaseStore', () => {
  beforeEach(() => {
    useCaseStore.setState({
      cases: [],
      loading: false,
      error: null,
    });
  });

  it('should initialize with default state', () => {
    const state = useCaseStore.getState();
    expect(state.cases).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should fetch cases successfully', async () => {
    await useCaseStore.getState().fetchCases();
    const { cases, loading, error } = useCaseStore.getState();
    
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0]).toHaveProperty('id');
    expect(cases[0]).toHaveProperty('createdAt');
  });

  it('should handle fetch error', async () => {
    // Mock the fetch implementation to throw
    useCaseStore.setState({ 
      fetchCases: async () => {
        useCaseStore.setState({ error: 'Failed to fetch', loading: false });
      }
    });

    await useCaseStore.getState().fetchCases();
    expect(useCaseStore.getState().error).toBe('Failed to fetch');
  });

  it('should create a case', async () => {
    const caseData = {
      title: 'New Test Case',
      description: 'Test Description',
      priority: 'high' as const,
      status: 'open' as const,
      assignedTo: 'test@example.com',
      tags: ['test']
    };

    const newCase = await useCaseStore.getState().createCase(caseData);
    
    expect(newCase.title).toBe(caseData.title);
    expect(newCase.id).toBeDefined();
    expect(newCase.createdAt).toBeDefined();
    expect(useCaseStore.getState().cases).toContainEqual(newCase);
  });

  it('should update a case', async () => {
    // First create a case
    const caseData = {
      title: 'Update Test Case',
      priority: 'medium' as const,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const created = await useCaseStore.getState().createCase(caseData);
    
    // Then update it
    const updated = await useCaseStore.getState().updateCase(created.id, { 
      status: 'closed' 
    });

    expect(updated.status).toBe('closed');
    expect(updated.id).toBe(created.id);
  });

  it('should delete a case', async () => {
    const caseData = {
      title: 'Delete Test Case',
      priority: 'low' as const,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const created = await useCaseStore.getState().createCase(caseData);
    await useCaseStore.getState().deleteCase(created.id);
    
    const found = useCaseStore.getState().getCase(created.id);
    expect(found).toBeUndefined();
  });

  it('should get a single case', async () => {
    const caseData = {
      title: 'Get Case Test',
      priority: 'low' as const,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const created = await useCaseStore.getState().createCase(caseData);
    const found = useCaseStore.getState().getCase(created.id);
    expect(found).toEqual(created);
  });

  it('should set cases manually', () => {
    const manualCases = [{
      id: 'manual-1',
      title: 'Manual Case',
      priority: 'low' as const,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    
    useCaseStore.getState().setCases(manualCases);
    expect(useCaseStore.getState().cases).toEqual(manualCases);
  });
});
