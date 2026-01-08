import { setupGlobalErrorHandlers } from '@/utils/errorHandler';
import { api } from '@/lib/api';

// Mock API
jest.mock('../../lib/api', () => ({
  api: {
    reportError: jest.fn(),
  },
}));

describe('Global Error Handlers', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    // Don't mock implementation of console.error fully, just spy, 
    // but the utility replaces it, so we need to be careful
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets up event listeners', () => {
    setupGlobalErrorHandlers();
    expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('intercepts critical console errors', () => {
    setupGlobalErrorHandlers();
    
    // Trigger the wrapped console.error
    console.error('Critical: Something went wrong');
    
    expect(api.reportError).toHaveBeenCalledWith(expect.objectContaining({
      type: 'console_error',
      message: 'Critical: Something went wrong',
    }));
  });

  it('ignores React deprecation warnings', () => {
    setupGlobalErrorHandlers();
    
    console.error('Warning: ReactDOM.render is no longer supported');
    
    // Should NOT report to API
    expect(api.reportError).not.toHaveBeenCalled();
  });
});
