
/**
 * evidence Service Tests
 */

import { evidenceService } from '../evidence';

describe('evidenceService', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], total: 0 }),
      })
    ) as jest.Mock;
  });

  it('should handle successful requests', async () => {
    // Mock successful response
    const result = await evidenceService.getEvidence();
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Mock error response - circuit breaker now returns resolved promise with empty data
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );
    const result = await evidenceService.getEvidence();
    expect(result).toEqual({ items: [], total: 0 }); // Should return empty result on error
  });
});
