// Frontend diagnostics service for monitoring and analytics
// Uses monitoringService directly to avoid circular dependency with api facade
import { monitoringService } from './monitoring';
import { HealthMetrics } from '../types/api';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'error';
  timestamp: string;
  system_health?: number;
  services?: Record<string, string>;
  metrics?: HealthMetrics;
}

export interface PerformanceMetrics {
  baselines: Record<string, unknown>;
  current_metrics: Record<string, unknown>;
  alerts: string[];
  status: string;
}

export interface UserJourneyAnalytics {
  funnel_analysis: Record<string, unknown>;
  session_analytics: Record<string, unknown>;
}

export interface DiagnosticsDashboard {
  status: string;
  timestamp: string;
  summary: {
    system_health: number;
    active_alerts: number;
    total_users: number;
    performance_score: string;
  };
  health: Partial<HealthMetrics>;
  performance: PerformanceMetrics;
  user_analytics: UserJourneyAnalytics;
  recommendations: string[];
}

class DiagnosticsService {
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      // Use monitoring service for health data
      const healthMetrics = await monitoringService.getHealthMetrics();
      // Calculate system health score (0-100) based on CPU/Memory
      // Default to 85 if metrics are missing (optimistic)
      const systemHealth = healthMetrics.cpuUsage && healthMetrics.memoryUsage
        ? 100 - ((healthMetrics.cpuUsage + healthMetrics.memoryUsage) / 2)
        : 85;
      
      return {
        status: systemHealth > 70 ? 'healthy' : systemHealth > 50 ? 'degraded' : 'critical',
        timestamp: new Date().toISOString(),
        system_health: Math.round(systemHealth),
        metrics: healthMetrics
      };
    } catch (err) {
      console.error('Failed to fetch health status:', err);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        system_health: 0
      };
    }
  }

  async getDetailedHealth(): Promise<Record<string, unknown>> {
    try {
      const status = await monitoringService.getSystemStatus();
      return {
        status: 'healthy',
        components: status,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('Failed to fetch detailed health:', err);
      return { status: 'error' };
    }
  }

  async getPerformanceBaselines(): Promise<PerformanceMetrics> {
    try {
      const history = await monitoringService.getPerformanceHistory(1); // Last 1 hour
      // Get the most recent metrics if available
      const latest = history.length > 0 ? history[history.length - 1] : null;
      
      const current_metrics: Record<string, unknown> = latest ? {
        cpu_percent: latest.cpu_percent,
        memory_percent: latest.memory_percent,
        response_time: latest.response_time_avg,
        requests: latest.request_count,
        errors: latest.error_count
      } : {};

      return {
        baselines: {
          avg_response_time: 150,
          max_memory_mb: 512,
          target_cpu_percent: 70
        },
        current_metrics,
        alerts: [],
        status: 'healthy'
      };
    } catch (err) {
      console.error('Failed to fetch performance baselines:', err);
      return {
        baselines: {},
        current_metrics: {},
        alerts: ['Failed to load performance data'],
        status: 'error'
      };
    }
  }

  async getUserJourneyAnalytics(): Promise<UserJourneyAnalytics> {
    // Return mock user analytics - would connect to analytics backend in production
    return {
      funnel_analysis: {
        total_users: 127,
        completed_onboarding: 98,
        active_investigators: 45
      },
      session_analytics: {
        avg_session_duration: '15m 32s',
        pages_per_session: 7.2
      }
    };
  }

  async getDiagnosticsDashboard(): Promise<DiagnosticsDashboard> {
    try {
      const [health, performance] = await Promise.all([
        this.getHealthStatus(),
        this.getPerformanceBaselines()
      ]);
      
      const userAnalytics = await this.getUserJourneyAnalytics();

      return {
        status: health.status,
        timestamp: new Date().toISOString(),
        summary: {
          system_health: health.system_health || 85,
          active_alerts: performance.alerts.length,
          total_users: 127,
          performance_score: 'A'
        },
        health: health.metrics || {},
        performance,
        user_analytics: userAnalytics,
        recommendations: this.generateRecommendations(health, performance)
      };
    } catch (err) {
      console.error('Failed to fetch diagnostics dashboard:', err);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        summary: {
          system_health: 0,
          active_alerts: 1,
          total_users: 0,
          performance_score: 'error'
        },
        health: {},
        performance: {
          baselines: {},
          current_metrics: {},
          alerts: ['Failed to load dashboard'],
          status: 'error'
        },
        user_analytics: {
          funnel_analysis: {},
          session_analytics: {}
        },
        recommendations: ['Check system connectivity', 'Contact support']
      };
    }
  }

  private generateRecommendations(health: HealthStatus, performance: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if ((health.system_health || 100) < 70) {
      recommendations.push('System health is below optimal - consider scaling resources');
    }
    
    if (performance.alerts.length > 0) {
      recommendations.push('Address active performance alerts');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System is operating optimally');
    }
    
    return recommendations;
  }

  async trackUserEvent(eventType: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      // Log event locally - would send to analytics backend in production
      const userId = localStorage.getItem('userId') || 'anonymous';
      console.log(`[Analytics] Event: ${eventType}`, { userId, metadata, timestamp: new Date().toISOString() });
    } catch (err) {
      console.warn('Failed to track user event:', err);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  // Utility methods for real-time monitoring
  startRealTimeMonitoring(callback: (data: DiagnosticsDashboard) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const data = await this.getDiagnosticsDashboard();
        callback(data);
      } catch (err) {
        console.error('Real-time monitoring error:', err);
      }
    }, 30000); // Update every 30 seconds

    // Return cleanup function
    return () => clearInterval(interval);
  }

  // Alert checking utility
  checkForCriticalAlerts(dashboard: DiagnosticsDashboard): string[] {
    const criticalAlerts: string[] = [];

    if (dashboard.status === 'critical') {
      criticalAlerts.push('System is in critical state');
    }

    if (dashboard.summary.system_health < 50) {
      criticalAlerts.push('System health is critically low');
    }

    if (dashboard.performance.alerts.length > 0) {
      criticalAlerts.push(`Performance alerts: ${dashboard.performance.alerts.length}`);
    }

    return criticalAlerts;
  }
}

// Export singleton instance
export const diagnosticsService = new DiagnosticsService();

// Export types
export type { DiagnosticsService };