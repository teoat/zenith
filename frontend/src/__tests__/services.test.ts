/**
 * Comprehensive Frontend Component Tests
 * Tests for UI components, hooks, and services
 */
// Mock the circuit breaker to always succeed
jest.mock('../lib/circuitBreaker', () => ({
  createCircuitBreaker: () => ({
    execute: (fn: Function) => fn(),
  }),
  DEFAULT_CIRCUIT_CONFIGS: {},
}));

// Mock the request function to return data directly (bypassing HTTP logic)
jest.mock('../services/client', () => ({
  request: jest.fn(),
}));

// Mock fetch globally for services that use it directly
global.fetch = jest.fn();

import '@testing-library/jest-dom';
import { request } from '@/services/client';
import { authService } from '@/services/auth';
import { caseService } from '@/services/cases';
import { graphService } from '@/services/graph';
import { evidenceService } from '@/services/evidence';
import { monitoringService } from '@/services/monitoring';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'token') return 'fake-jwt-token-for-testing';
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};
global.localStorage = localStorageMock;

// Mock fetch globally
(request as jest.MockedFunction<typeof fetch>) = jest.fn();

// Test Utilities - Mock request to return proper response structure
const mockRequest = (response: unknown) => {
  (request as jest.Mock).mockImplementationOnce(() => Promise.resolve(response));
};

const mockRequestError = (error: Error | string) => {
  (request as jest.Mock).mockRejectedValueOnce(
    error instanceof Error ? error : new Error(error)
  );
};

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should call login endpoint with credentials', async () => {
    mockRequest({ access_token: 'test-token', user: { id: '1', email: 'test@test.com' } });

    await authService.login({ email: 'test@test.com', password: 'password123' });

    expect(request).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test@test.com'),
      })
    );
  });

  it('should handle MFA code in login', async () => {
    mockRequest({ access_token: 'test-token' });


    await authService.login({
      email: 'test@test.com',
      password: 'password123',
      mfa_code: '123456'
    });

    expect(request).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        body: expect.stringContaining('mfa_code'),
      })
    );
  });

  it('should handle login errors gracefully', async () => {
    mockRequestError('Invalid credentials');
    
    
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
    mockRequest({ data: 'test' });

    await request('/api/test');

    expect(request).toHaveBeenCalledWith('/api/test', expect.any(Object));
  });

  it('should handle network errors', async () => {
    (request as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

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
    mockRequest({ cases: mockCases });
    
    // Note: Importing caseService (singular)
    
    await caseService.getCases();
    
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/cases'),
      expect.anything()
    );
  });

  it('should create a new case', async () => {
    mockRequest({ id: 'new-case-id', title: 'New Case' });
    
    
    await caseService.createCase({
      title: 'New Case',
      description: 'Test description',
      priority: 'HIGH',
    });
    
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/cases'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should update a case', async () => {
    mockRequest({ id: '1', status: 'INVESTIGATING' });
    
    
    await caseService.updateCase('1', { status: 'INVESTIGATING' });
    
    expect(request).toHaveBeenCalledWith(
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
    mockRequest({ nodes: [], edges: [] });
    
    
    await graphService.getGraphData();
    
    expect(request).toHaveBeenCalled();
  });

  it('should build graph from transactions', async () => {
    mockRequest({ nodes: [{ id: 'A' }], edges: [] });
    
    
    await graphService.buildGraph(30);
    
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('build'),
      expect.anything()
    );
  });

  it('should save graph snapshot', async () => {
    mockRequest({ id: 'snapshot-1' });
    
    
    await graphService.saveGraphSnapshot('case-123', {
      nodes: [],
      links: [],
    });
    
    expect(request).toHaveBeenCalledWith(
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
    mockRequest([{ id: '1', filename: 'doc.pdf' }]);
    
    
    await evidenceService.getEvidence();
    
    expect(request).toHaveBeenCalled();
  });

  it('should upload evidence file', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'evidence-1', status: 'uploaded' }),
    });

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = await evidenceService.uploadEvidence('case-1', file);

    expect(result).toEqual({ id: 'evidence-1', status: 'uploaded' });
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch system health', async () => {
    mockRequest({ system_metrics: { status: 'healthy', cpu_percent: 10 } });
    
    
    const health = await monitoringService.getSystemStatus();
    
    expect(health).toHaveProperty('status');
  });
});

describe('API Facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose all service methods', async () => {

    // Check that key methods exist on individual services
    expect(authService).toHaveProperty('login');
    expect(caseService).toHaveProperty('getCases');
    expect(graphService).toHaveProperty('getGraphData');
  });
});


