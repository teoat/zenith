/**
 * Alerting System for Vercel Edge Gateway
 * Monitors system health and sends alerts for critical issues
 */

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = "high_error_rate" | "high_latency" | "service_down" | "rate_limited" | "cache_miss";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metric: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface AlertThresholds {
  errorRateCritical: number;
  errorRateWarning: number;
  latencyP95Critical: number;
  latencyP95Warning: number;
  cacheHitRateWarning: number;
  consecutiveErrorsCritical: number;
}

const defaultThresholds: AlertThresholds = {
  errorRateCritical: 10,
  errorRateWarning: 5,
  latencyP95Critical: 5000,
  latencyP95Warning: 2000,
  cacheHitRateWarning: 50,
  consecutiveErrorsCritical: 10,
};

const alerts: Alert[] = [];
const alertCallbacks: ((alert: Alert) => void)[] = [];

export function checkAlerts(
  metrics: ReturnType<typeof import("./monitoring").getAggregateMetrics>,
  thresholds: AlertThresholds = defaultThresholds
): Alert[] {
  const newAlerts: Alert[] = [];
  const now = new Date();

  const summary = metrics.summary;

  if (summary.errorRate >= thresholds.errorRateCritical) {
    const alert: Alert = {
      id: `alert-${now.getTime()}-high-error-rate-critical`,
      type: "high_error_rate",
      severity: "critical",
      message: `Critical: Error rate is ${summary.errorRate.toFixed(2)}% (threshold: ${thresholds.errorRateCritical}%)`,
      metric: summary.errorRate,
      threshold: thresholds.errorRateCritical,
      timestamp: now,
      acknowledged: false,
    };
    newAlerts.push(alert);
  } else if (summary.errorRate >= thresholds.errorRateWarning) {
    const alert: Alert = {
      id: `alert-${now.getTime()}-high-error-rate-warning`,
      type: "high_error_rate",
      severity: "warning",
      message: `Warning: Error rate is ${summary.errorRate.toFixed(2)}% (threshold: ${thresholds.errorRateWarning}%)`,
      metric: summary.errorRate,
      threshold: thresholds.errorRateWarning,
      timestamp: now,
      acknowledged: false,
    };
    newAlerts.push(alert);
  }

  const endpointMetrics = metrics.endpointMetrics;
  for (const endpoint of endpointMetrics) {
    if (endpoint.p95LatencyMs >= thresholds.latencyP95Critical) {
      const alert: Alert = {
        id: `alert-${now.getTime()}-high-latency-critical-${endpoint.path}`,
        type: "high_latency",
        severity: "critical",
        message: `Critical: P95 latency for ${endpoint.method} ${endpoint.path} is ${endpoint.p95LatencyMs.toFixed(2)}ms`,
        metric: endpoint.p95LatencyMs,
        threshold: thresholds.latencyP95Critical,
        timestamp: now,
        acknowledged: false,
      };
      newAlerts.push(alert);
    } else if (endpoint.p95LatencyMs >= thresholds.latencyP95Warning) {
      const alert: Alert = {
        id: `alert-${now.getTime()}-high-latency-warning-${endpoint.path}`,
        type: "high_latency",
        severity: "warning",
        message: `Warning: P95 latency for ${endpoint.method} ${endpoint.path} is ${endpoint.p95LatencyMs.toFixed(2)}ms`,
        metric: endpoint.p95LatencyMs,
        threshold: thresholds.latencyP95Warning,
        timestamp: now,
        acknowledged: false,
      };
      newAlerts.push(alert);
    }
  }

  if (summary.cacheHitRate < thresholds.cacheHitRateWarning && summary.cacheHitRate > 0) {
    const alert: Alert = {
      id: `alert-${now.getTime()}-cache-miss-warning`,
      type: "cache_miss",
      severity: "warning",
      message: `Warning: Cache hit rate is ${summary.cacheHitRate.toFixed(2)}%`,
      metric: summary.cacheHitRate,
      threshold: thresholds.cacheHitRateWarning,
      timestamp: now,
      acknowledged: false,
    };
    newAlerts.push(alert);
  }

  for (const alert of newAlerts) {
    alerts.push(alert);
    notifyAlertCallbacks(alert);
  }

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recentAlerts = alerts.filter(
    (a) => a.timestamp > oneHourAgo && !a.acknowledged
  );

  while (alerts.length > 1000) {
    alerts.shift();
  }

  return recentAlerts;
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function clearAcknowledgedAlerts(): number {
  const before = alerts.length;
  const filtered = alerts.filter((a) => !a.acknowledged);
  const removed = before - filtered.length;
  alerts.length = 0;
  alerts.push(...filtered);
  return removed;
}

export function getRecentAlerts(limit: number = 50): Alert[] {
  return alerts
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function getActiveAlerts(): Alert[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  return alerts
    .filter((a) => a.timestamp > oneHourAgo && !a.acknowledged)
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

export function onAlert(callback: (alert: Alert) => void): () => void {
  alertCallbacks.push(callback);
  return () => {
    const index = alertCallbacks.indexOf(callback);
    if (index > -1) {
      alertCallbacks.splice(index, 1);
    }
  };
}

function notifyAlertCallbacks(alert: Alert): void {
  for (const callback of alertCallbacks) {
    try {
      callback(alert);
    } catch (error) {
      console.error("Error in alert callback:", error);
    }
  }
}

export function setAlertWebhook(url: string): void {
  onAlert(async (alert) => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to send alert webhook:", error);
    }
  });
}

export function getAlertSummary(): {
  total: number;
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
} {
  const active = getActiveAlerts();
  return {
    total: alerts.length,
    critical: active.filter((a) => a.severity === "critical").length,
    warning: active.filter((a) => a.severity === "warning").length,
    info: active.filter((a) => a.severity === "info").length,
    unacknowledged: active.length,
  };
}

export const alerting = {
  checkAlerts,
  acknowledgeAlert,
  clearAcknowledgedAlerts,
  getRecentAlerts,
  getActiveAlerts,
  onAlert,
  setAlertWebhook,
  getAlertSummary,
  defaultThresholds,
};
