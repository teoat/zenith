// src/utils/performanceMonitor.ts
// Performance monitoring utilities

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
}

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initObservers();
    this.measureTTFB();
  }

  private initObservers() {
    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.fcp = lastEntry.startTime;
        console.log('FCP:', this.metrics.fcp);
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch {
      console.warn('FCP observer not supported');
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry & { processingStart?: number }) => {
          if (entry.processingStart !== undefined) {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry & { hadRecentInput?: boolean; value?: number }) => {
          if (!entry.hadRecentInput && entry.value !== undefined) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch {
      console.warn('CLS observer not supported');
    }
  }

  private measureTTFB() {
    // Time to First Byte - measure navigation timing
    if ('performance' in window && 'timing' in window.performance) {
      const timing = window.performance.timing;
      this.metrics.ttfb = timing.responseStart - timing.requestStart;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public logMetrics() {
    console.group('🚀 Performance Metrics');
    console.log('FCP (First Contentful Paint):', this.metrics.fcp ? `${this.metrics.fcp.toFixed(2)}ms` : 'Not measured');
    console.log('LCP (Largest Contentful Paint):', this.metrics.lcp ? `${this.metrics.lcp.toFixed(2)}ms` : 'Not measured');
    console.log('FID (First Input Delay):', this.metrics.fid ? `${this.metrics.fid.toFixed(2)}ms` : 'Not measured');
    console.log('CLS (Cumulative Layout Shift):', this.metrics.cls ? this.metrics.cls.toFixed(4) : 'Not measured');
    console.log('TTFB (Time to First Byte):', this.metrics.ttfb ? `${this.metrics.ttfb}ms` : 'Not measured');
    console.groupEnd();
  }

  public reportToAnalytics() {
    // Send metrics to analytics service
    const metrics = this.getMetrics();

    // Example: Send to analytics
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'Performance Metrics',
        value: Math.round(metrics.lcp || 0),
        custom_map: {
          metric_fcp: metrics.fcp,
          metric_lcp: metrics.lcp,
          metric_fid: metrics.fid,
          metric_cls: metrics.cls,
          metric_ttfb: metrics.ttfb
        }
      });
    }
  }

  public destroy() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch {
        // Observer might already be disconnected
      }
    });
    this.observers = [];
  }
}

// Web Vitals thresholds (Google recommended)
export const WEB_VITALS_THRESHOLDS = {
  fcp: { good: 1800, needsImprovement: 3000 }, // ms
  lcp: { good: 2500, needsImprovement: 4000 }, // ms
  fid: { good: 100, needsImprovement: 300 },   // ms
  cls: { good: 0.1, needsImprovement: 0.25 },  // score
  ttfb: { good: 800, needsImprovement: 1800 }  // ms
};

export const performanceMonitor = new PerformanceMonitor();

// Auto-report metrics after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logMetrics();
      performanceMonitor.reportToAnalytics();
    }, 100);
  });

  // Report before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.reportToAnalytics();
  });
}

export default PerformanceMonitor;