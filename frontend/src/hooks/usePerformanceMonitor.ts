import { useEffect, useRef, useCallback } from 'react';
import { secureLogger } from '../utils/secureLogger';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  slowestRenderTime: number;
  totalRenderTime: number;
  isSlow: boolean;
}

interface UsePerformanceMonitorOptions {
  threshold?: number; // ms
  enableLogging?: boolean;
  reportToAnalytics?: boolean;
}

interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics;
  markRenderStart: () => void;
  markRenderEnd: () => void;
  resetMetrics: () => void;
}

/**
 * Performance monitoring hook for React components
 * Tracks render times, counts, and performance metrics
 */
export const usePerformanceMonitor = (
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
): UsePerformanceMonitorReturn => {
  const {
    threshold = 16, // 60fps threshold
    enableLogging = process.env.NODE_ENV === 'development',
    reportToAnalytics = false
  } = options;

  const renderStartRef = useRef<number | null>(null);
  const renderTimesRef = useRef<number[]>([]);
  const renderCountRef = useRef(0);
  const slowestRenderRef = useRef(0);
  const totalRenderTimeRef = useRef(0);

  const markRenderStart = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const markRenderEnd = useCallback(() => {
    if (renderStartRef.current === null) return;

    const renderTime = performance.now() - renderStartRef.current;
    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);
    totalRenderTimeRef.current += renderTime;

    if (renderTime > slowestRenderRef.current) {
      slowestRenderRef.current = renderTime;
    }

    // Keep only last 100 render times for memory efficiency
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-50);
    }

    // Log slow renders
    if (renderTime > threshold) {
      if (enableLogging) {
        secureLogger.warn(`[PERF] ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }

      // Report to analytics if enabled
      if (reportToAnalytics && window.gtag) {
        window.gtag('event', 'component_slow_render', {
          component_name: componentName,
          render_time: renderTime,
          render_count: renderCountRef.current,
          threshold
        });
      }
    }

    renderStartRef.current = null;
  }, [componentName, threshold, enableLogging, reportToAnalytics]);

  const resetMetrics = useCallback(() => {
    renderStartRef.current = null;
    renderTimesRef.current = [];
    renderCountRef.current = 0;
    slowestRenderRef.current = 0;
    totalRenderTimeRef.current = 0;
  }, []);

  // Auto-track renders using useEffect
  useEffect(() => {
    markRenderStart();

    return () => {
      markRenderEnd();
    };
  });

  const metrics: PerformanceMetrics = {
    componentName,
    renderCount: renderCountRef.current,
    averageRenderTime: renderCountRef.current > 0
      ? totalRenderTimeRef.current / renderCountRef.current
      : 0,
    slowestRenderTime: slowestRenderRef.current,
    totalRenderTime: totalRenderTimeRef.current,
    isSlow: slowestRenderRef.current > threshold * 2 // Consider slow if slowest render is 2x threshold
  };

  return {
    metrics,
    markRenderStart,
    markRenderEnd,
    resetMetrics
  };
};

/**
 * Performance monitoring hook for functions
 */
export const useFunctionPerformance = (
  functionName: string,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    threshold = 5,
    enableLogging = process.env.NODE_ENV === 'development',
    reportToAnalytics = false
  } = options;

  const executionCountRef = useRef(0);
  const totalTimeRef = useRef(0);
  const slowestExecutionRef = useRef(0);

  const wrapFunction = useCallback(<T extends (...args: never[]) => unknown>(
    fn: T
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();

      try {
        const result = fn(...args);
        const duration = performance.now() - start;

        executionCountRef.current += 1;
        totalTimeRef.current += duration;

        if (duration > slowestExecutionRef.current) {
          slowestExecutionRef.current = duration;
        }

        if (duration > threshold) {
          if (enableLogging) {
            secureLogger.warn(`[PERF] ${functionName} slow execution: ${duration.toFixed(2)}ms`);
          }

          if (reportToAnalytics && window.gtag) {
            window.gtag('event', 'function_slow_execution', {
              function_name: functionName,
              execution_time: duration,
              execution_count: executionCountRef.current,
              threshold
            });
          }
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        secureLogger.error(`[PERF] ${functionName} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    }) as T;
  }, [functionName, threshold, enableLogging, reportToAnalytics]);

  return {
    wrapFunction,
    metrics: {
      functionName,
      executionCount: executionCountRef.current,
      averageExecutionTime: executionCountRef.current > 0
        ? totalTimeRef.current / executionCountRef.current
        : 0,
      slowestExecutionTime: slowestExecutionRef.current,
      totalExecutionTime: totalTimeRef.current
    }
  };
};

/**
 * Global performance monitor singleton
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initObservers();
  }

  private initObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;
          if (lastEntry) {
            secureLogger.info(`[PERF] LCP: ${lastEntry.startTime}ms`);
            if (window.gtag) {
              window.gtag('event', 'web_vitals', {
                metric_name: 'LCP',
                value: lastEntry.startTime
              });
            }
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        secureLogger.warn('[PERF] LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fidEntry = entry as PerformanceEventTiming;
            secureLogger.info(`[PERF] FID: ${fidEntry.processingStart - fidEntry.startTime}ms`);
            if (window.gtag) {
              window.gtag('event', 'web_vitals', {
                metric_name: 'FID',
                value: fidEntry.processingStart - fidEntry.startTime
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        secureLogger.warn('[PERF] FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const layoutShift = entry as LayoutShift;
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          });
          secureLogger.info(`[PERF] CLS: ${clsValue}`);
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              metric_name: 'CLS',
              value: clsValue
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        secureLogger.warn('[PERF] CLS observer not supported');
      }
    }
  }

  recordComponentMetrics(componentName: string, metrics: PerformanceMetrics) {
    this.metrics.set(componentName, metrics);

    if (metrics.isSlow) {
      secureLogger.warn(`[PERF] Component ${componentName} is performing poorly:`, metrics);
    }
  }

  getComponentMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  getAllMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// React hook to use global performance monitor
export const useGlobalPerformanceMonitor = () => {
  const recordMetrics = useCallback((componentName: string, metrics: PerformanceMetrics) => {
    performanceMonitor.recordComponentMetrics(componentName, metrics);
  }, []);

  return {
    recordMetrics,
    getComponentMetrics: (componentName: string) => performanceMonitor.getComponentMetrics(componentName),
    getAllMetrics: () => performanceMonitor.getAllMetrics(),
  };
};