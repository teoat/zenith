
/**
 * reporting Service Tests
 */

import { reportingService } from '../reporting';

describe('reportingService', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ metrics: {} }),
      })
    ) as jest.Mock;
  });

  it('should handle successful requests', async () => {
    // Mock successful response
    const result = await reportingService.getMetrics();
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Mock error response - circuit breaker now returns resolved promise with empty data
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );
    const result = await reportingService.getMetrics();
    expect(result).toEqual({ metrics: {} }); // Should return object with empty metrics on error
  });


});
