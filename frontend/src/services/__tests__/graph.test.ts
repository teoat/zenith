
/**
 * graph Service Tests
 */

import { graphService } from '../graph';

describe('graphService', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ graph_data: { nodes: [], links: [] } }),
      })
    ) as jest.Mock;
  });

  it('should handle successful requests', async () => {
    // Mock successful response
    const result = await graphService.getGraphData();
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Mock error response - circuit breaker now returns resolved promise with empty data
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );
    const result = await graphService.getGraphData();
    expect(result).toEqual({ links: [], nodes: [], stats: undefined }); // Should return empty result on error
  });
});
