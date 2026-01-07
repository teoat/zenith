// Types and interfaces for Predictive Maintenance Dashboard
export interface SystemMetrics {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  disk_io_percent: number;
  network_latency_ms: number;
  active_connections: number;
  queue_depth: number;
  error_rate: number;
  response_time_ms: number;
}

export interface FailurePrediction {
  failure_mode: string;
  probability: number;
  time_to_failure_hours: number;
  confidence_score: number;
  contributing_factors: string[];
  recommended_actions: string[];
  predicted_impact: string;
}

export interface ChaosExperimentResult {
  experiment_id: string;
  experiment_type: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  system_stability_score: number;
  failure_injection_success: boolean;
  recovery_time_seconds: number;
  affected_services: string[];
  lessons_learned: string[];
}

export interface SelfHealingAction {
  action_id: string;
  action_type: string;
  target_service: string;
  trigger_condition: string;
  execution_time: string;
  success: boolean;
  impact_assessment: string;
  rollback_available: boolean;
}
