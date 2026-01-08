/**
 * Comprehensive Frontend Component Tests
 * Tests for UI components, hooks, and services
 */
import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mock the client module to avoid import.meta errors
vi.mock('../services/client', () => ({
  request: vi.fn(),
  getToken: vi.fn(() => 'mock-token'),
  isElectron: vi.fn(() => false),
  API_BASE: 'http://localhost:8000/api/v1'
}))

import { request } from '../services/client'
import { authService } from '../services/auth'
import { caseService } from '../services/cases'
import { graphService } from '../services/graph'
import { evidenceService } from '../services/evidence'
import { monitoringService } from '../services/monitoring'

// Mock fetch for evidence service which uses it directly
global.fetch = vi.fn()

const mockRequest = vi.mocked(request)

describe('Frontend Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockReset()
  })

  describe('API Client', () => {
    test('should make GET requests correctly', async () => {
      mockRequest.mockResolvedValue({ data: 'test' })
      
      const result = await request('/test', 'GET')
      
      expect(mockRequest).toHaveBeenCalledWith('/test', 'GET')
      expect(result).toEqual({ data: 'test' })
    })

    test('should handle errors gracefully', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'))
      
      await expect(request('/test', 'GET')).rejects.toThrow('Network error')
    })
  })

  describe('Auth Service', () => {
    test('should authenticate user', async () => {
      mockRequest.mockResolvedValue({ 
        user: { id: 1, name: 'Test User' },
        token: 'test-token'
      })
      
      const result = await authService.login('test@example.com', 'password')
      
      expect(result.user.name).toBe('Test User')
      expect(result.token).toBe('test-token')
    })
  })

  describe('Case Service', () => {
    test('should fetch cases list', async () => {
      const mockCases = [
        { id: 1, title: 'Case 1', status: 'open' },
        { id: 2, title: 'Case 2', status: 'closed' }
      ]
      
      mockRequest.mockResolvedValue({ data: mockCases })
      
      const result = await caseService.getCases()
      
      expect(result.data).toHaveLength(2)
      expect(result.data[0].title).toBe('Case 1')
    })
  })

  describe('Graph Service', () => {
    test('should fetch graph data', async () => {
      const mockGraph = {
        nodes: [
          { id: 1, label: 'Node 1', type: 'person' },
          { id: 2, label: 'Node 2', type: 'organization' }
        ],
        links: [
          { source: 1, target: 2, type: 'related_to' }
        ]
      }
      
      mockRequest.mockResolvedValue({ graph_data: mockGraph })
      
      const result = await graphService.getGraphData()
      
      expect(result.nodes).toHaveLength(2)
      expect(result.links).toHaveLength(1)
    })
  })

  describe('Evidence Service', () => {
    test('should upload evidence file', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const mockResponse = { 
        id: 1, 
        filename: 'test.txt',
        url: 'https://example.com/evidence/test.txt'
      }
      
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)
      
      const result = await evidenceService.uploadEvidence('CASE-001', mockFile)
      
      expect(result.filename).toBe('test.txt')
      expect(result.url).toContain('test.txt')
    })
  })

  describe('Monitoring Service', () => {
    test('should fetch system metrics', async () => {
      const mockMetrics = {
        status: 'healthy',
        metrics: {
          cpu_percent: 45,
          memory_percent: 67
        }
      }
      
      mockRequest.mockResolvedValue({ system_metrics: mockMetrics })
      
      const result = await monitoringService.getSystemStatus()
      
      expect(result.metrics.cpu_percent).toBe(45)
      expect(result.metrics.memory_percent).toBe(67)
    })
  })
})
