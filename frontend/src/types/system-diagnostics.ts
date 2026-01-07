export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  response_time: number;
  error_rate: number;
  throughput: number;
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "offline";
  response_time: number;
  last_check: string;
  error_count: number;
  uptime_percentage: number;
}

export interface PerformanceMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  requests_per_second: number;
  error_rate: number;
}

export interface DiagnosticIssue {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "performance" | "security" | "reliability" | "compliance";
  title: string;
  description: string;
  affected_services: string[];
  detected_at: string;
  resolved_at?: string;
  recommendations: string[];
}

export interface SystemDiagnosticsResponse {
  system_status: {
    uptime_seconds: number;
    performance_metrics: {
      cpu_percent: number;
      memory_percent: number;
      disk_usage_percent: number;
      network_connections: number;
      response_time_avg: number;
    };
  };
  health: {
    components: Record<
      string,
      {
        status: string;
        response_time_ms?: number;
        error?: boolean;
      }
    >;
  };
  key_metrics: {
    total_requests: number;
    total_errors: number;
  };
  performance_history: Array<{
    timestamp: string;
    cpu_percent: number;
    memory_percent: number;
    disk_usage_percent: number;
    network_connections: number;
    request_count: number;
    error_count: number;
  }>;
  error_summary: {
    recent_errors: Array<{
      error_type: string;
      message: string;
      timestamp: string;
    }>;
  };
}
