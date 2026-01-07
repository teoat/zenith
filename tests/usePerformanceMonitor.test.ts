import { renderHook } from '@testing-library/react';
import { usePerformanceMonitor, useFunctionPerformance } from '@/usePerformanceMonitor';

describe('usePerformanceMonitor', () => {
  it('returns performance monitoring interface', () => {
    const { result } = renderHook(() =>
      usePerformanceMonitor('TestComponent', { threshold: 10 })
    );

    expect(result.current).toHaveProperty('metrics');
    expect(result.current).toHaveProperty('markRenderStart');
    expect(result.current).toHaveProperty('markRenderEnd');
    expect(result.current).toHaveProperty('resetMetrics');
    expect(result.current.metrics.componentName).toBe('TestComponent');
  });

  it('initializes with zero metrics', () => {
    const { result } = renderHook(() =>
      usePerformanceMonitor('TestComponent')
    );

    expect(result.current.metrics.renderCount).toBe(0);
    expect(result.current.metrics.averageRenderTime).toBe(0);
    expect(result.current.metrics.totalRenderTime).toBe(0);
    expect(result.current.metrics.slowestRenderTime).toBe(0);
    expect(result.current.metrics.isSlow).toBe(false);
  });
});

describe('useFunctionPerformance', () => {
  it('returns function performance interface', () => {
    const { result } = renderHook(() =>
      useFunctionPerformance('testFunction')
    );

    expect(result.current).toHaveProperty('wrapFunction');
    expect(result.current).toHaveProperty('metrics');
    expect(result.current.metrics.functionName).toBe('testFunction');
  });

  it('wraps functions correctly', () => {
    const { result } = renderHook(() =>
      useFunctionPerformance('testFunction')
    );

    const testFunction = (x: number) => x * 2;
    const wrappedFunction = result.current.wrapFunction(testFunction);

    expect(typeof wrappedFunction).toBe('function');
    expect(wrappedFunction(5)).toBe(10);
  });
});
