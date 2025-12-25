import PerformanceMonitor, { performanceMonitor } from '../performanceMonitor';

describe('PerformanceMonitor', () => {
  let mockConsoleGroup: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    mockConsoleGroup = jest.spyOn(console, 'group').mockImplementation(() => {});
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock window.performance
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        timing: {
          requestStart: 1000,
          responseStart: 1100,
        },
        getEntriesByType: jest.fn().mockReturnValue([]),
      },
    });

    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(),
    })) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes correctly', () => {
    expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('measures TTFB on init', () => {
    const monitor = new PerformanceMonitor();
    const metrics = monitor.getMetrics();
    expect(metrics.ttfb).toBe(100); // 1100 - 1000
  });

  it('logs metrics', () => {
    const monitor = new PerformanceMonitor();
    monitor.logMetrics();
    expect(mockConsoleGroup).toHaveBeenCalledWith('🚀 Performance Metrics');
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  it('reports to analytics if gtag exists', () => {
    const mockGtag = jest.fn();
    window.gtag = mockGtag;
    
    const monitor = new PerformanceMonitor();
    monitor.reportToAnalytics();
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', expect.any(Object));
    
    delete window.gtag;
  });

  it('cleans up observers on destroy', () => {
    const monitor = new PerformanceMonitor();
    // @ts-ignore - accessing private property for test
    const disconnectSpy = jest.fn();
    // @ts-ignore
    monitor.observers = [{ disconnect: disconnectSpy }];
    
    monitor.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
