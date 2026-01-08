import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "../../lib/http-client";
import { cache } from "../../lib/cache";
import { monitoring } from "../../lib/monitoring";
import { alerting } from "../../lib/alerting";
import { circuitBreaker } from "../../lib/circuit-breaker";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "health";

  if (action === "health") {
    return NextResponse.json({
      status: "healthy",
      service: "vercel-edge-gateway",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }

  if (action === "stats") {
    const aggregateMetrics = monitoring.getAggregateMetrics();
    const cacheStats = { enabled: true, size: "N/A" };
    const circuitStates = circuitBreaker.getAllCircuitBreakerStates();

    return NextResponse.json({
      status: "healthy",
      service: "vercel-edge-gateway",
      timestamp: new Date().toISOString(),
      metrics: aggregateMetrics,
      cache: cacheStats,
      circuits: circuitStates,
    });
  }

  if (action === "metrics") {
    const prometheusMetrics = monitoring.formatMetricsForPrometheus();
    return new NextResponse(prometheusMetrics, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  }

  if (action === "alerts") {
    const alertSummary = alerting.getAlertSummary();
    const activeAlerts = alerting.getActiveAlerts();

    return NextResponse.json({
      status: alertSummary.critical > 0 ? "degraded" : "healthy",
      alerts: alertSummary,
      active: activeAlerts.slice(0, 20),
    });
  }

  if (action === "ready") {
    const aggregateMetrics = monitoring.getAggregateMetrics();
    const circuitStates = circuitBreaker.getAllCircuitBreakerStates();

    const allCircuitsClosed = circuitStates.every((c) => c.state === "closed");
    const errorRateAcceptable = aggregateMetrics.summary.errorRate < 10;

    const ready = allCircuitsClosed && errorRateAcceptable;

    return NextResponse.json({
      ready,
      checks: {
        circuits: allCircuitsClosed,
        errorRate: errorRateAcceptable,
      },
      errorRate: aggregateMetrics.summary.errorRate.toFixed(2) + "%",
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
