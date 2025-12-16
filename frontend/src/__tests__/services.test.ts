/**
 * Comprehensive Frontend Component Tests
 * Tests for UI components, hooks, and services
 */
import '@testing-library/jest-dom';

// Mock fetch globally
(global.fetch as jest.MockedFunction<typeof fetch>) = jest.fn();

// Test Utilities
const mockFetch = (response: unknown) => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    ok: true,
    json: async () => response,
  } as Response);
};

const mockFetchError = (status: number) => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ detail: 'Error' }),
  } as Response);
};

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should call login endpoint with credentials', async () => {
    mockFetch({ access_token: 'test-token', user: { id: '1', email: 'test@test.com' } });
    
    const { authService } = await import('../services/auth');
    
    await authService.login({ email: 'test@test.com', password: 'password123' });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test@test.com'),
      })
    );
  });

  it('should handle MFA code in login', async () => {
    mockFetch({ access_token: 'test-token' });
    
    const { authService } = await import('../services/auth');
    
    await authService.login({ 
      email: 'test@test.com', 
      password: 'password123',
      mfa_code: '123456'
    });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('mfa_code'),
      })
    );
  });

  it('should handle login errors gracefully', async () => {
    mockFetchError(401);
    
    const { authService } = await import('../services/auth');
    
    await expect(authService.login({ 
      email: 'wrong@test.com', 
      password: 'wrong' 
    })).rejects.toThrow();
  });
});

describe('Client Request Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add authorization header when token exists', async () => {
    localStorage.setItem('token', 'test-token');
    mockFetch({ data: 'test' });
    
    const { request } = await import('../services/client');
    
    await request('/api/test');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));
    
    const { request } = await import('../services/client');
    
    await expect(request('/api/test')).rejects.toThrow('Network error');
  });
});

describe('Cases Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch cases list', async () => {
    const mockCases = [
      { id: '1', title: 'Case 1', status: 'OPEN' },
      { id: '2', title: 'Case 2', status: 'CLOSED' },
    ];
    mockFetch({ cases: mockCases });
    
    // Note: Importing caseService (singular)
    const { caseService } = await import('../services/cases');
    
    await caseService.getCases();
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/cases'),
      expect.anything()
    );
  });

  it('should create a new case', async () => {
    mockFetch({ id: 'new-case-id', title: 'New Case' });
    
    const { caseService } = await import('../services/cases');
    
    await caseService.createCase({
      title: 'New Case',
      description: 'Test description',
      priority: 'HIGH',
    });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/cases'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should update a case', async () => {
    mockFetch({ id: '1', status: 'INVESTIGATING' });
    
    const { caseService } = await import('../services/cases');
    
    await caseService.updateCase('1', { status: 'INVESTIGATING' });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/cases/1'),
      expect.objectContaining({
        method: 'PUT',
      })
    );
  });
});

describe('Graph Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch graph data', async () => {
    mockFetch({ nodes: [], edges: [] });
    
    const { graphService } = await import('../services/graph');
    
    await graphService.getGraphData();
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should build graph from transactions', async () => {
    mockFetch({ nodes: [{ id: 'A' }], edges: [] });
    
    const { graphService } = await import('../services/graph');
    
    await graphService.buildGraph(30);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('build'),
      expect.anything()
    );
  });

  it('should save graph snapshot', async () => {
    mockFetch({ id: 'snapshot-1' });
    
    const { graphService } = await import('../services/graph');
    
    await graphService.saveGraphSnapshot('case-123', {
      nodes: [],
      links: [],
    });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('snapshot'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});

describe('Evidence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch evidence list', async () => {
    mockFetch([{ id: '1', filename: 'doc.pdf' }]);
    
    const { evidenceService } = await import('../services/evidence');
    
    await evidenceService.getEvidence();
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should upload evidence file', async () => {
    mockFetch({ id: 'evidence-1', status: 'uploaded' });
    
    const { evidenceService } = await import('../services/evidence');
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    await evidenceService.uploadEvidence('case-1', file);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});

describe('Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch system health', async () => {
    mockFetch({ system_metrics: { status: 'healthy', cpu_percent: 10 } });
    
    const { monitoringService } = await import('../services/monitoring');
    
    const health = await monitoringService.getSystemStatus();
    
    expect(health).toHaveProperty('status');
  });
});

describe('API Facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose all service methods', async () => {
    const { api } = await import('../lib/api');
    
    // Check that key methods exist
    expect(api).toHaveProperty('login');
    expect(api).toHaveProperty('getCases');
    expect(api).toHaveProperty('getGraphData');
  });
});


