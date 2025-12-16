"""
Application Performance Monitoring (APM) Integration
Task 5.2: Monitoring & Alerting System

Provides:
- Request/Response tracking
- Error tracking and aggregation
- Performance metrics
- Real-time alerting
- Health checks
"""

import time
import traceback
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

logger = logging.getLogger(__name__)


class MonitoringMetrics:
    """Central metrics collection"""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.endpoint_metrics: Dict[str, Dict[str, Any]] = {}
        self.errors: list = []
        self.max_errors_stored = 100
    
    def record_request(self, endpoint: str, method: str, duration: float, status_code: int):
        """Record request metrics"""
        self.request_count += 1
        self.total_response_time += duration
        
        key = f"{method} {endpoint}"
        if key not in self.endpoint_metrics:
            self.endpoint_metrics[key] = {
                'count': 0,
                'total_time': 0.0,
                'errors': 0,
                'min_time': float('inf'),
                'max_time': 0.0,
                'status_codes': {}
            }
        
        metrics = self.endpoint_metrics[key]
        metrics['count'] += 1
        metrics['total_time'] += duration
        metrics['min_time'] = min(metrics['min_time'], duration)
        metrics['max_time'] = max(metrics['max_time'], duration)
        
        # Track status codes
        status_key = str(status_code)
        metrics['status_codes'][status_key] = metrics['status_codes'].get(status_key, 0) + 1
        
        if status_code >= 400:
            metrics['errors'] += 1
            self.error_count += 1
    
    def record_error(self, error: Exception, endpoint: str, context: Dict[str, Any]):
        """Record error details"""
        error_record = {
            'timestamp': datetime.now().isoformat(),
            'type': type(error).__name__,
            'message': str(error),
            'endpoint': endpoint,
            'traceback': traceback.format_exc(),
            'context': context
        }
        
        self.errors.append(error_record)
        
        # Keep only recent errors
        if len(self.errors) > self.max_errors_stored:
            self.errors = self.errors[-self.max_errors_stored:]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get aggregated statistics"""
        avg_response_time = (
            self.total_response_time / self.request_count 
            if self.request_count > 0 
            else 0
        )
        
        # Calculate endpoint statistics
        endpoint_stats = []
        for endpoint, metrics in self.endpoint_metrics.items():
            avg_time = metrics['total_time'] / metrics['count']
            error_rate = metrics['errors'] / metrics['count'] if metrics['count'] > 0 else 0
            
            endpoint_stats.append({
                'endpoint': endpoint,
                'requests': metrics['count'],
                'avg_response_time_ms': round(avg_time * 1000, 2),
                'min_response_time_ms': round(metrics['min_time'] * 1000, 2),
                'max_response_time_ms': round(metrics['max_time'] * 1000, 2),
                'error_rate': round(error_rate * 100, 2),
                'status_codes': metrics['status_codes']
            })
        
        # Sort by request count
        endpoint_stats.sort(key=lambda x: x['requests'], reverse=True)
        
        return {
            'total_requests': self.request_count,
            'total_errors': self.error_count,
            'error_rate': round(self.error_count / self.request_count * 100, 2) if self.request_count > 0 else 0,
            'avg_response_time_ms': round(avg_response_time * 1000, 2),
            'endpoints': endpoint_stats[:20],  # Top 20 endpoints
            'recent_errors': self.errors[-10:]  # Last 10 errors
        }


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for automatic request/response monitoring"""
    
    def __init__(self, app: ASGIApp, metrics: MonitoringMetrics):
        super().__init__(app)
        self.metrics = metrics
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Track request timing and errors"""
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Record metrics
            self.metrics.record_request(
                endpoint=request.url.path,
                method=request.method,
                duration=duration,
                status_code=response.status_code
            )
            
            # Add timing header
            response.headers['X-Response-Time'] = f"{duration * 1000:.2f}ms"
            
            return response
            
        except Exception as error:
            duration = time.time() - start_time
            
            # Record error
            self.metrics.record_error(
                error=error,
                endpoint=request.url.path,
                context={
                    'method': request.method,
                    'duration': duration,
                    'query_params': dict(request.query_params),
                    'path_params': dict(request.path_params)
                }
            )
            
            # Log error
            logger.error(
                f"Error in {request.method} {request.url.path}: {error}",
                exc_info=True
            )
            
            raise


class HealthCheck:
    """System health monitoring"""
    
    def __init__(self):
        self.checks: Dict[str, Callable] = {}
    
    def register(self, name: str, check_func: Callable):
        """Register a health check"""
        self.checks[name] = check_func
    
    async def run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {}
        all_healthy = True
        
        for name, check_func in self.checks.items():
            try:
                is_healthy = await check_func() if callable(check_func) else check_func()
                results[name] = {
                    'status': 'healthy' if is_healthy else 'unhealthy',
                    'timestamp': datetime.now().isoformat()
                }
                if not is_healthy:
                    all_healthy = False
            except Exception as e:
                results[name] = {
                    'status': 'error',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }
                all_healthy = False
        
        return {
            'status': 'healthy' if all_healthy else 'degraded',
            'checks': results,
            'timestamp': datetime.now().isoformat()
        }


class AlertManager:
    """Alert threshold management and notifications"""
    
    def __init__(self, metrics: MonitoringMetrics):
        self.metrics = metrics
        self.thresholds = {
            'error_rate': 5.0,  # %
            'avg_response_time': 1000,  # ms
            'error_count': 100,  # total
        }
        self.alerts: list = []
    
    def check_thresholds(self) -> list:
        """Check if any metrics exceed thresholds"""
        stats = self.metrics.get_stats()
        triggered_alerts = []
        
        # Check error rate
        if stats['error_rate'] > self.thresholds['error_rate']:
            triggered_alerts.append({
                'type': 'error_rate',
                'severity': 'high',
                'message': f"Error rate {stats['error_rate']}% exceeds threshold {self.thresholds['error_rate']}%",
                'value': stats['error_rate'],
                'threshold': self.thresholds['error_rate']
            })
        
        # Check response time
        if stats['avg_response_time_ms'] > self.thresholds['avg_response_time']:
            triggered_alerts.append({
                'type': 'response_time',
                'severity': 'medium',
                'message': f"Average response time {stats['avg_response_time_ms']}ms exceeds threshold {self.thresholds['avg_response_time']}ms",
                'value': stats['avg_response_time_ms'],
                'threshold': self.thresholds['avg_response_time']
            })
        
        # Check total errors
        if stats['total_errors'] > self.thresholds['error_count']:
            triggered_alerts.append({
                'type': 'error_count',
                'severity': 'high',
                'message': f"Total errors {stats['total_errors']} exceeds threshold {self.thresholds['error_count']}",
                'value': stats['total_errors'],
                'threshold': self.thresholds['error_count']
            })
        
        if triggered_alerts:
            self.alerts.extend(triggered_alerts)
        
        return triggered_alerts
    
    def get_active_alerts(self) -> list:
        """Get recent alerts"""
        return self.alerts[-50:]  # Last 50 alerts


# Global instances
metrics = MonitoringMetrics()
health_check = HealthCheck()
alert_manager = AlertManager(metrics)


# Integration example for FastAPI
def setup_monitoring(app):
    """Setup monitoring for FastAPI application"""
    
    # Add middleware
    app.add_middleware(PerformanceMonitoringMiddleware, metrics=metrics)
    
    # Register health checks
    async def check_database():
        # Add your database health check
        return True
    
    async def check_redis():
        # Add your Redis health check
        return True
    
    health_check.register('database', check_database)
    health_check.register('redis', check_redis)
    
    # Add monitoring endpoints
    @app.get("/monitoring/metrics")
    async def get_metrics():
        """Get application metrics"""
        return metrics.get_stats()
    
    @app.get("/monitoring/health")
    async def get_health():
        """Get health check status"""
        return await health_check.run_checks()
    
    @app.get("/monitoring/alerts")
    async def get_alerts():
        """Get active alerts"""
        return {
            'active_alerts': alert_manager.get_active_alerts(),
            'thresholds': alert_manager.thresholds
        }
    
    return app


if __name__ == "__main__":
    print("Monitoring System Components:")
    print("  ✓ Performance tracking")
    print("  ✓ Error aggregation")
    print("  ✓ Health checks")
    print("  ✓ Alert management")
    print("\nIntegration:")
    print("  from app.monitoring import setup_monitoring")
    print("  app = setup_monitoring(app)")
