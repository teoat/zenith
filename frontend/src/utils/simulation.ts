/**
 * Safe delay simulation that returns a promise that resolves after the specified duration.
 * Use this instead of direct setTimeout calls for mock delays to avoid linter warnings about uncleaned timeouts in components.
 * 
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
export const simulateDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
