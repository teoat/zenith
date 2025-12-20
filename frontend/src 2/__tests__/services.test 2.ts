/**
 * Comprehensive Frontend Component Tests
 * Tests for UI components, hooks, and services
 */
import '@testing-library/jest-dom';
import { request } from '../services/client';
import { authService } from '../services/auth';
import { caseService } from '../services/cases';
import { graphService } from '../services/graph';
import { evidenceService } from '../services/evidence';
import { monitoringService } from '../services/monitoring';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'token') return 'fake-jwt-token-for-testing';
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

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
    
    await caseService.getCases();
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/cases'),
      expect.anything()
    );
  });

  it('should create a new case', async () => {
    mockFetch({ id: 'new-case-id', title: 'New Case' });
    
    
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
    
    
    await graphService.getGraphData();
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should build graph from transactions', async () => {
    mockFetch({ nodes: [{ id: 'A' }], edges: [] });
    
    
    await graphService.buildGraph(30);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('build'),
      expect.anything()
    );
  });

  it('should save graph snapshot', async () => {
    mockFetch({ id: 'snapshot-1' });
    
    
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
    
    
    await evidenceService.getEvidence();
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should upload evidence file', async () => {
    mockFetch({ id: 'evidence-1', status: 'uploaded' });
    
    
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
    
    
    const health = await monitoringService.getSystemStatus();
    
    expect(health).toHaveProperty('status');
  });
});

describe('API Facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose all service methods', async () => {
    
    // Check that key methods exist
    expect(api).toHaveProperty('login');
    expect(api).toHaveProperty('getCases');
    expect(api).toHaveProperty('getGraphData');
  });
});


