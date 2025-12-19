/**
 * Web Vitals monitoring utility
 * Tracks Core Web Vitals metrics for performance monitoring
 */

import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import { secureLogger } from './secureLogger';

// Initialize Web Vitals monitoring
export const initWebVitals = () => {
  // Core Web Vitals
  onCLS((metric) => {
    secureLogger.info('PERFORMANCE', 'CLS', { value: metric.value });
    // Send to analytics service
  });



  onFCP((metric) => {
    secureLogger.info('PERFORMANCE', 'FCP', { value: metric.value });
    // Send to analytics service
  });

  onLCP((metric) => {
    secureLogger.info('PERFORMANCE', 'LCP', { value: metric.value });
    // Send to analytics service
  });

  onTTFB((metric) => {
    secureLogger.info('PERFORMANCE', 'TTFB', { value: metric.value });
    // Send to analytics service
  });
};

// Auto-initialize when this module is imported
initWebVitals();