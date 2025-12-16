/**
 * Web Vitals monitoring utility
 * Tracks Core Web Vitals metrics for performance monitoring
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

// Initialize Web Vitals monitoring
export const initWebVitals = () => {
  // Core Web Vitals
  onCLS((metric) => {
    console.log('CLS:', metric.value);
    // Send to analytics service
  });

  onFID((metric) => {
    console.log('FID:', metric.value);
    // Send to analytics service
  });

  onFCP((metric) => {
    console.log('FCP:', metric.value);
    // Send to analytics service
  });

  onLCP((metric) => {
    console.log('LCP:', metric.value);
    // Send to analytics service
  });

  onTTFB((metric) => {
    console.log('TTFB:', metric.value);
    // Send to analytics service
  });
};

// Auto-initialize when this module is imported
initWebVitals();