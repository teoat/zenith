/**
 * Performance Monitoring for Vercel Edge Gateway
 * Tracks request metrics, latency, and error rates
 */

interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatencyMs: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimitHits: number;
}

interface EndpointMetrics {
  path: string;
  method: string;
  requests: number;
  errors: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

const metrics: RequestMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalLatencyMs: 0,
  cacheHits: 0,
  cacheMisses: 0,
  rateLimitHits: 0,
};

const endpointMetrics = new Map<string, EndpointMetrics>();
const latencyBuckets = new Map<string, number[]>();

function getEndpointKey(path: string, method: string): string {
  return `${method}:${path}`;
}

export function recordRequest(
  path: string,
  method: string,
  statusCode: number,
  latencyMs: number,
  cached: boolean = false,
  rateLimited: boolean = false
): void {
  metrics.totalRequests++;

  if (statusCode >= 200 && statusCode < 300) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }

  metrics.totalLatencyMs += latencyMs;

  if (cached) {
    metrics.cacheHits++;
  } else {
    metrics.cacheMisses++;
  }

  if (rateLimited) {
    metrics.rateLimitHits++;
  }

  const key = getEndpointKey(path, method);

  if (!endpointMetrics.has(key)) {
    endpointMetrics.set(key, {
      path,
      method,
      requests: 0,
      errors: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
    });
  }

  const endpoint = endpointMetrics.get(key)!;
  endpoint.requests++;

  if (statusCode >= 400) {
    endpoint.errors++;
  }

  if (!latencyBuckets.has(key)) {
    latencyBuckets.set(key, []);
  }
  latencyBuckets.get(key)!.push(latencyMs);

  if (latencyBuckets.get(key)!.length > 1000) {
    latencyBuckets.set(key, latencyBuckets.get(key)!.slice(-1000));
  }

  const latencies = latencyBuckets.get(key)!;
  if (latencies.length > 0) {
    latencies.sort((a, b) => a - b);
    endpoint.p50LatencyMs = latencies[Math.floor(latencies.length * 0.5)];
    endpoint.p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)];
    endpoint.p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)];
    endpoint.avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }
}

export function getMetrics(): RequestMetrics {
  return { ...metrics };
}

export function getEndpointMetrics(): EndpointMetrics[] {
  return Array.from(endpointMetrics.values());
}

export function getAggregateMetrics(): {
  requestMetrics: RequestMetrics;
  endpointMetrics: EndpointMetrics[];
  summary: {
    successRate: number;
    avgLatencyMs: number;
    cacheHitRate: number;
    errorRate: number;
    totalEndpoints: number;
  };
} {
  const total = metrics.totalRequests || 1;

  return {
    requestMetrics: metrics,
    endpointMetrics: getEndpointMetrics(),
    summary: {
      successRate: (metrics.successfulRequests / total) * 100,
      avgLatencyMs: metrics.totalLatencyMs / total,
      cacheHitRate: (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 || 0,
      errorRate: (metrics.failedRequests / total) * 100,
      totalEndpoints: endpointMetrics.size,
    },
  };
}

export function resetMetrics(): void {
  metrics.totalRequests = 0;
  metrics.successfulRequests = 0;
  metrics.failedRequests = 0;
  metrics.totalLatencyMs = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.rateLimitHits = 0;
  endpointMetrics.clear();
  latencyBuckets.clear();
}

export function formatMetricsForPrometheus(): string {
  const lines: string[] = [];

  lines.push(`# Vercel Edge Gateway Metrics`);
  lines.push(`# Generated at ${new Date().toISOString()}`);
  lines.push("");

  lines.push(`# Request Metrics`);
  lines.push(`zenith_edge_total_requests ${metrics.totalRequests}`);
  lines.push(`zenith_edge_successful_requests ${metrics.successfulRequests}`);
  lines.push(`zenith_edge_failed_requests ${metrics.failedRequests}`);
  lines.push(`zenith_edge_total_latency_ms ${metrics.totalLatencyMs.toFixed(2)}`);
  lines.push(`zenith_edge_cache_hits ${metrics.cacheHits}`);
  lines.push(`zenith_edge_cache_misses ${metrics.cacheMisses}`);
  lines.push(`zenith_edge_rate_limit_hits ${metrics.rateLimitHits}`);
  lines.push("");

  const total = metrics.totalRequests || 1;
  lines.push(`zenith_edge_success_rate ${((metrics.successfulRequests / total) * 100).toFixed(2)}`);
  lines.push(`zenith_edge_avg_latency_ms ${(metrics.totalLatencyMs / total).toFixed(2)}`);
  lines.push(`zenith_edge_cache_hit_rate ${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2)}`);
  lines.push(`zenith_edge_error_rate ${((metrics.failedRequests / total) * 100).toFixed(2)}`);
  lines.push("");

  lines.push(`# Endpoint Metrics`);
  const endpoints = Array.from(endpointMetrics.values());
  for (const endpoint of endpoints) {
    const endpointName = endpoint.path.replace(/[^a-zA-Z0-9]/g, "_");
    lines.push(`zenith_edge_endpoint_requests{endpoint="${endpoint.path}",method="${endpoint.method}"} ${endpoint.requests}`);
    lines.push(`zenith_edge_endpoint_errors{endpoint="${endpoint.path}",method="${endpoint.method}"} ${endpoint.errors}`);
    lines.push(`zenith_edge_endpoint_latency_avg{endpoint="${endpoint.path}",method="${endpoint.method}"} ${endpoint.avgLatencyMs.toFixed(2)}`);
    lines.push(`zenith_edge_endpoint_latency_p50{endpoint="${endpoint.path}",method="${endpoint.method}"} ${endpoint.p50LatencyMs.toFixed(2)}`);
    lines.push(`zenith_edge_endpoint_latency_p95{endpoint="${endpoint.path}",method="${endpoint.method}"} ${endpoint.p95LatencyMs.toFixed(2)}`);
    lines.push(`zenith_edge_endpoint_latency_p99{endpoint="${endpoint.path}",method="${endpoint.method}"} ${endpoint.p99LatencyMs.toFixed(2)}`);
  }

  return lines.join("\n");
}

export const monitoring = {
  recordRequest,
  getMetrics,
  getEndpointMetrics,
  getAggregateMetrics,
  resetMetrics,
  formatMetricsForPrometheus,
};
