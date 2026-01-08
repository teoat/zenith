/**
 * Vercel Analytics Integration
 * Tracks performance, errors, and user behavior
 */

import { config } from "./config";

interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

interface PerformanceMetric {
  path: string;
  duration: number;
  statusCode: number;
  cached: boolean;
  timestamp: number;
}

// In-memory analytics buffer (flushed periodically)
const analyticsBuffer: AnalyticsEvent[] = [];
const performanceBuffer: PerformanceMetric[] = [];
const MAX_BUFFER_SIZE = 100;

export function trackEvent(name: string, properties: Record<string, unknown> = {}): void {
  analyticsBuffer.push({
    name,
    properties: {
      ...properties,
      environment: process.env.NODE_ENV || "development",
    },
    timestamp: Date.now(),
  });

  // Flush if buffer is full
  if (analyticsBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  }
}

export function trackPerformance(metric: Omit<PerformanceMetric, "timestamp">): void {
  performanceBuffer.push({
    ...metric,
    timestamp: Date.now(),
  });

  // Flush if buffer is full
  if (performanceBuffer.length >= MAX_BUFFER_SIZE) {
    flushPerformance();
  }
}

export function flushEvents(): AnalyticsEvent[] {
  const events = [...analyticsBuffer];
  analyticsBuffer.length = 0;
  return events;
}

export function flushPerformance(): PerformanceMetric[] {
  const metrics = [...performanceBuffer];
  performanceBuffer.length = 0;
  return metrics;
}

export function getAnalyticsSummary(): {
  events: { total: number; byName: Record<string, number> };
  performance: {
    total: number;
    avgDuration: number;
    p95Duration: number;
    cacheHitRate: number;
    errorRate: number;
  };
} {
  const eventsByName: Record<string, number> = {};
  for (const event of analyticsBuffer) {
    eventsByName[event.name] = (eventsByName[event.name] || 0) + 1;
  }

  const durations = performanceBuffer.map((m) => m.duration).sort((a, b) => a - b);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const p95Index = Math.floor(durations.length * 0.95);
  const p95Duration = durations[p95Index] || 0;
  const cachedCount = performanceBuffer.filter((m) => m.cached).length;
  const errorCount = performanceBuffer.filter((m) => m.statusCode >= 400).length;

  return {
    events: {
      total: analyticsBuffer.length,
      byName: eventsByName,
    },
    performance: {
      total: performanceBuffer.length,
      avgDuration: Math.round(avgDuration * 100) / 100,
      p95Duration: Math.round(p95Duration * 100) / 100,
      cacheHitRate: performanceBuffer.length > 0 ? (cachedCount / performanceBuffer.length) * 100 : 0,
      errorRate: performanceBuffer.length > 0 ? (errorCount / performanceBuffer.length) * 100 : 0,
    },
  };
}

export const analytics = {
  trackEvent,
  trackPerformance,
  flushEvents,
  flushPerformance,
  getAnalyticsSummary,
};
