import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { graphService } from '../graph';

global.fetch = jest.fn();

describe('GraphService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRelationships', () => {
    it('should fetch entity relationships', async () => {
      const mockGraph = {
        nodes: [
          { id: '1', label: 'John Doe', type: 'person' },
          { id: '2', label: 'Acme Corp', type: 'organization' }
        ],
        edges: [
          { source: '1', target: '2', label: 'works_at' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraph
      });

      const result = await graphService.getRelationships('case-123');
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
    });
  });

  describe('findShortestPath', () => {
    it('should find shortest path between entities', async () => {
      const mockPath = {
        path: ['1', '2', '3'],
        distance: 2,
        relationships: ['friend_of', 'colleague_of']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPath
      });

      const result = await graphService.findShortestPath('entity-1', 'entity-3');
      expect(result.distance).toBe(2);
      expect(result.path).toHaveLength(3);
    });
  });

  describe('detectCommunities', () => {
    it('should detect communities in graph', async () => {
      const mockCommunities = [
        { id: 'comm-1', members: ['1', '2', '3'], density: 0.8 },
        { id: 'comm-2', members: ['4', '5'], density: 0.6 }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommunities
      });

      const result = await graphService.detectCommunities('case-123');
      expect(result).toHaveLength(2);
      expect(result[0].density).toBeGreaterThan(0.5);
    });
  });
});
