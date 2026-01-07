import { useState, useEffect, useCallback } from "react";
import { secureLogger } from "@/utils/secureLogger";
import { secureRandom } from "@/utils/secureRandom";

export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  parentId?: string;
  children: TraceSpan[];
}

export interface BusinessMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, any>;
  unit?: string;
}

export interface PerformanceBaseline {
  metric: string;
  baseline: number;
  threshold: number;
  unit: string;
  lastUpdated: number;
}

export interface AnomalyAlert {
  id: string;
  metric: string;
  value: number;
  expectedValue: number;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  description: string;
}

class AdvancedMonitoring {
  private traces: Map<string, TraceSpan> = new Map();
  private metrics: BusinessMetric[] = [];
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private alerts: AnomalyAlert[] = [];
  private activeSpans: Map<string, TraceSpan> = new Map();

  // Distributed Tracing
  startTrace(
    name: string,
    tags: Record<string, any> = {},
    parentId?: string,
  ): string {
    const spanId = this.generateId();
    const span: TraceSpan = {
      id: spanId,
      name,
      startTime: Date.now(),
      tags,
      parentId,
      children: [],
    };

    this.activeSpans.set(spanId, span);

    if (parentId) {
      const parentSpan = this.activeSpans.get(parentId);
      if (parentSpan) {
        parentSpan.children.push(span);
      }
    }

    return spanId;
  }

  endTrace(spanId: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;

      this.traces.set(spanId, span);
      this.activeSpans.delete(spanId);

      // Send trace to monitoring service
      this.sendTrace(span);
    }
  }

  private sendTrace(span: TraceSpan): void {
    // In a real implementation, this would send to Jaeger, Zipkin, or similar
    secureLogger.info("MONITORING", "Trace completed", {
      id: span.id,
      name: span.name,
      duration: span.duration,
      tags: span.tags,
    });
  }

  // Business Metrics
  recordMetric(
    name: string,
    value: number,
    tags: Record<string, any> = {},
    unit?: string,
  ): void {
    const metric: BusinessMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for anomalies
    this.detectAnomaly(metric);

    // Send to monitoring service
    this.sendMetric(metric);
  }

  private sendMetric(metric: BusinessMetric): void {
    secureLogger.info("MONITORING", "Metric recorded", metric);
  }

  // Performance Baselines
  setBaseline(
    metric: string,
    baseline: number,
    threshold: number,
    unit: string,
  ): void {
    const performanceBaseline: PerformanceBaseline = {
      metric,
      baseline,
      threshold,
      unit,
      lastUpdated: Date.now(),
    };

    this.baselines.set(metric, performanceBaseline);
  }

  getBaseline(metric: string): PerformanceBaseline | undefined {
    return this.baselines.get(metric);
  }

  updateBaselines(): void {
    // Calculate baselines from historical data
    const metricGroups = this.groupMetricsByName();

    for (const [metricName, metrics] of metricGroups) {
      if (metrics.length < 10) continue; // Need minimum data points

      const values = metrics.map((m) => m.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length,
      );

      // Set baseline as mean, threshold as 2 standard deviations
      this.setBaseline(
        metricName,
        mean,
        stdDev * 2,
        metrics[0].unit || "count",
      );
    }
  }

  private groupMetricsByName(): Map<string, BusinessMetric[]> {
    const groups = new Map<string, BusinessMetric[]>();

    for (const metric of this.metrics) {
      if (!groups.has(metric.name)) {
        groups.set(metric.name, []);
      }
      groups.get(metric.name)!.push(metric);
    }

    return groups;
  }

  // AI-Powered Anomaly Detection
  private detectAnomaly(metric: BusinessMetric): void {
    const baseline = this.baselines.get(metric.name);
    if (!baseline) return;

    const deviation = Math.abs(metric.value - baseline.baseline);
    const isAnomaly = deviation > baseline.threshold;

    if (isAnomaly) {
      const severity = this.calculateSeverity(deviation, baseline.threshold);

      const alert: AnomalyAlert = {
        id: this.generateId(),
        metric: metric.name,
        value: metric.value,
        expectedValue: baseline.baseline,
        severity,
        timestamp: Date.now(),
        description: `${metric.name} deviated by ${deviation.toFixed(2)} ${baseline.unit} from baseline`,
      };

      this.alerts.push(alert);

      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }

      this.sendAlert(alert);
    }
  }

  private calculateSeverity(
    deviation: number,
    threshold: number,
  ): "low" | "medium" | "high" | "critical" {
    const ratio = deviation / threshold;

    if (ratio >= 3) return "critical";
    if (ratio >= 2) return "high";
    if (ratio >= 1.5) return "medium";
    return "low";
  }

  private sendAlert(alert: AnomalyAlert): void {
    secureLogger.warn("MONITORING", "Anomaly detected", alert);

    // In a real implementation, this would send notifications
    // via email, Slack, PagerDuty, etc.
  }

  // Utility methods
  private generateId(): string {
    return secureRandom.random().toString(36).substring(2, 11);
  }

  // Getters for UI
  getTraces(): TraceSpan[] {
    return Array.from(this.traces.values());
  }

  getMetrics(limit: number = 100): BusinessMetric[] {
    return this.metrics.slice(-limit);
  }

  getAlerts(limit: number = 50): AnomalyAlert[] {
    return this.alerts.slice(-limit);
  }

  getBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  getActiveSpans(): TraceSpan[] {
    return Array.from(this.activeSpans.values());
  }
}

// Singleton instance
export const advancedMonitoring = new AdvancedMonitoring();

// React hooks
export const useTracing = () => {
  const startTrace = useCallback(
    (name: string, tags?: Record<string, any>, parentId?: string) => {
      return advancedMonitoring.startTrace(name, tags, parentId);
    },
    [],
  );

  const endTrace = useCallback((spanId: string) => {
    advancedMonitoring.endTrace(spanId);
  }, []);

  return { startTrace, endTrace };
};

export const useMetrics = () => {
  const [metrics, setMetrics] = useState(advancedMonitoring.getMetrics());

  const recordMetric = useCallback(
    (
      name: string,
      value: number,
      tags?: Record<string, any>,
      unit?: string,
    ) => {
      advancedMonitoring.recordMetric(name, value, tags, unit);
      setMetrics(advancedMonitoring.getMetrics());
    },
    [],
  );

  const updateBaselines = useCallback(() => {
    advancedMonitoring.updateBaselines();
  }, []);

  return {
    metrics,
    recordMetric,
    updateBaselines,
    baselines: advancedMonitoring.getBaselines(),
  };
};

export const useAnomalyDetection = () => {
  const [alerts, setAlerts] = useState(advancedMonitoring.getAlerts());

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(advancedMonitoring.getAlerts());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { alerts };
};

// Performance monitoring wrapper
export const withTracing = <T extends any[], R>(
  fn: (...args: T) => R,
  name: string,
  tags?: Record<string, any>,
) => {
  return (...args: T): R => {
    const spanId = advancedMonitoring.startTrace(name, tags);
    try {
      const result = fn(...args);
      advancedMonitoring.endTrace(spanId);
      return result;
    } catch (error) {
      advancedMonitoring.endTrace(spanId);
      throw error;
    }
  };
};
