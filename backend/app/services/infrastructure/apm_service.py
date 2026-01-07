import builtins
import contextlib
import json
import logging
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Any

import psutil

try:
    # Global audit service instance
    from app.services.infrastructure.security.audit_service import audit_service
except ImportError:
    from app.services.infrastructure.security.audit_service import audit_service

logger = logging.getLogger(__name__)


class APMService:
    """Application Performance Monitoring service"""

    def __init__(self, max_metrics_history: int = 1000):
        self.max_metrics_history = max_metrics_history

        # Metrics storage
        self.request_metrics = deque(maxlen=max_metrics_history)
        self.system_metrics = deque(maxlen=max_metrics_history)
        self.error_metrics = deque(maxlen=max_metrics_history)

        # Performance thresholds
        self.slow_request_threshold = 1.0  # seconds
        self.high_cpu_threshold = 80.0  # percentage
        self.high_memory_threshold = 85.0  # percentage

        # Threading control
        self._stop_event = threading.Event()
        self._thread = None

    def start_monitoring(self):
        """Start background APM monitoring"""
        if self._thread is None or not self._thread.is_alive():
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._system_monitor_worker, daemon=True)
            self._thread.start()

    def stop_monitoring(self):
        """Stop APM monitoring"""
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)

    def record_request(
        self,
        method: str,
        endpoint: str,
        duration: float,
        status_code: int,
        user_id: str | None = None,
    ) -> None:
        """Record an API request for performance monitoring"""
        metric = {
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "endpoint": endpoint,
            "duration": duration,
            "status_code": status_code,
            "user_id": user_id,
            "is_slow": duration > self.slow_request_threshold,
            "response_time_category": self._categorize_response_time(duration),
        }

        self.request_metrics.append(metric)

        # Log slow requests
        if duration > self.slow_request_threshold:
            logger.warning(f"Slow request: {method} {endpoint} took {duration:.2f}s")

    def record_error(
        self,
        error_type: str,
        message: str,
        endpoint: str | None = None,
        user_id: str | None = None,
        stack_trace: str | None = None,
    ) -> None:
        """Record an application error"""
        error_metric = {
            "timestamp": datetime.now().isoformat(),
            "error_type": error_type,
            "message": message,
            "endpoint": endpoint,
            "user_id": user_id,
            "stack_trace": (stack_trace[:500] if stack_trace else None),  # Limit stack trace length
        }

        self.error_metrics.append(error_metric)
        logger.error(f"Application error: {error_type} - {message}")

    def _system_monitor_worker(self):
        """Background worker for system monitoring"""
        while not self._stop_event.is_set():
            try:
                metrics = self._collect_system_metrics()
                self.system_metrics.append(metrics)
                # Sleep for 30 seconds, wake up if stopped
                if self._stop_event.wait(30):
                    break
            except Exception as e:
                # Avoid logging if shutting down
                if not self._stop_event.is_set():
                    with contextlib.suppress(builtins.BaseException):
                        logger.error(f"System monitoring error: {e}")
                if self._stop_event.wait(60):
                    break

    def _collect_system_metrics(self) -> dict[str, Any]:
        """Collect current system metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()

            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_mb = memory.used / (1024 * 1024)
            memory_total_mb = memory.total / (1024 * 1024)

            # Disk metrics
            disk = psutil.disk_usage("/")
            disk_percent = disk.percent
            disk_used_gb = disk.used / (1024 * 1024 * 1024)
            disk_total_gb = disk.total / (1024 * 1024 * 1024)

            # Network metrics (basic)
            network = psutil.net_io_counters()
            bytes_sent_mb = network.bytes_sent / (1024 * 1024)
            bytes_recv_mb = network.bytes_recv / (1024 * 1024)

            # Process metrics
            process = psutil.Process()
            process_memory_mb = process.memory_info().rss / (1024 * 1024)
            process_cpu_percent = process.cpu_percent()

            return {
                "timestamp": datetime.now().isoformat(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count,
                    "frequency_mhz": cpu_freq.current if cpu_freq else None,
                    "is_high": cpu_percent > self.high_cpu_threshold,
                },
                "memory": {
                    "percent": memory_percent,
                    "used_mb": round(memory_used_mb, 2),
                    "total_mb": round(memory_total_mb, 2),
                    "is_high": memory_percent > self.high_memory_threshold,
                },
                "disk": {
                    "percent": disk_percent,
                    "used_gb": round(disk_used_gb, 2),
                    "total_gb": round(disk_total_gb, 2),
                },
                "network": {
                    "bytes_sent_mb": round(bytes_sent_mb, 2),
                    "bytes_recv_mb": round(bytes_recv_mb, 2),
                },
                "process": {
                    "memory_mb": round(process_memory_mb, 2),
                    "cpu_percent": round(process_cpu_percent, 2),
                },
            }

        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            return {"timestamp": datetime.now().isoformat(), "error": str(e)}

    def _categorize_response_time(self, duration: float) -> str:
        """Categorize response time"""
        if duration < 0.1:
            return "fast"
        elif duration < 0.5:
            return "normal"
        elif duration < 1.0:
            return "slow"
        else:
            return "very_slow"

    def get_performance_summary(self, hours: int = 1) -> dict[str, Any]:
        """Get performance summary for the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        # Filter recent metrics
        recent_requests = [r for r in self.request_metrics if datetime.fromisoformat(r["timestamp"]) > cutoff_time]
        recent_system = [s for s in self.system_metrics if datetime.fromisoformat(s["timestamp"]) > cutoff_time]
        recent_errors = [e for e in self.error_metrics if datetime.fromisoformat(e["timestamp"]) > cutoff_time]

        # Calculate request metrics
        request_summary = self._calculate_request_metrics(recent_requests)

        # Calculate system metrics
        system_summary = self._calculate_system_metrics(recent_system)

        # Calculate error metrics
        error_summary = self._calculate_error_metrics(recent_errors)

        # Generate alerts
        alerts = self._generate_performance_alerts(request_summary, system_summary, error_summary)

        return {
            "time_range_hours": hours,
            "request_metrics": request_summary,
            "system_metrics": system_summary,
            "error_metrics": error_summary,
            "alerts": alerts,
            "generated_at": datetime.now().isoformat(),
        }

    def _calculate_request_metrics(self, requests: list[dict[str, Any]]) -> dict[str, Any]:
        """Calculate request performance metrics"""
        if not requests:
            return {"total_requests": 0}

        durations = [r["duration"] for r in requests]
        status_codes = [r["status_code"] for r in requests]

        # Response time statistics
        avg_duration = sum(durations) / len(durations)
        p95_duration = sorted(durations)[int(len(durations) * 0.95)] if durations else 0
        p99_duration = sorted(durations)[int(len(durations) * 0.99)] if durations else 0

        # Status code distribution
        status_distribution = defaultdict(int)
        for code in status_codes:
            status_distribution[code] += 1

        # Endpoint performance
        endpoint_stats = defaultdict(list)
        for req in requests:
            endpoint_stats[req["endpoint"]].append(req["duration"])

        endpoint_performance = {}
        for endpoint, times in endpoint_stats.items():
            endpoint_performance[endpoint] = {
                "count": len(times),
                "avg_duration": sum(times) / len(times),
                "max_duration": max(times),
            }

        return {
            "total_requests": len(requests),
            "requests_per_minute": len(requests) / 60,  # Assuming 1 hour = 60 minutes
            "avg_response_time": round(avg_duration, 3),
            "p95_response_time": round(p95_duration, 3),
            "p99_response_time": round(p99_duration, 3),
            "slow_requests_count": sum(1 for r in requests if r["is_slow"]),
            "status_distribution": dict(status_distribution),
            "endpoint_performance": endpoint_performance,
        }

    def _calculate_system_metrics(self, system_metrics: list[dict[str, Any]]) -> dict[str, Any]:
        """Calculate system performance metrics"""
        if not system_metrics:
            return {"samples": 0}

        cpu_percents = [m["cpu"]["percent"] for m in system_metrics if "cpu" in m]
        memory_percents = [m["memory"]["percent"] for m in system_metrics if "memory" in m]

        return {
            "samples": len(system_metrics),
            "avg_cpu_percent": (round(sum(cpu_percents) / len(cpu_percents), 2) if cpu_percents else 0),
            "max_cpu_percent": max(cpu_percents) if cpu_percents else 0,
            "avg_memory_percent": (round(sum(memory_percents) / len(memory_percents), 2) if memory_percents else 0),
            "max_memory_percent": max(memory_percents) if memory_percents else 0,
            "cpu_high_events": sum(1 for m in system_metrics if m.get("cpu", {}).get("is_high", False)),
            "memory_high_events": sum(1 for m in system_metrics if m.get("memory", {}).get("is_high", False)),
        }

    def _calculate_error_metrics(self, errors: list[dict[str, Any]]) -> dict[str, Any]:
        """Calculate error metrics"""
        if not errors:
            return {"total_errors": 0}

        error_types = defaultdict(int)
        for error in errors:
            error_types[error["error_type"]] += 1

        return {
            "total_errors": len(errors),
            "errors_per_hour": len(errors),  # Assuming 1 hour window
            "error_types": dict(error_types),
            "most_common_error": (max(error_types.items(), key=lambda x: x[1]) if error_types else None),
        }

    def _generate_performance_alerts(self, request_metrics: dict, system_metrics: dict, error_metrics: dict) -> list[dict[str, Any]]:
        """Generate performance alerts based on metrics"""
        alerts = []

        # High error rate alert
        if error_metrics.get("total_errors", 0) > 10:
            alerts.append(
                {
                    "level": "critical",
                    "type": "high_error_rate",
                    "message": f"High error rate: {error_metrics['total_errors']} errors in the last hour",
                    "metric": "error_rate",
                    "threshold": 10,
                    "current_value": error_metrics["total_errors"],
                }
            )

        # Slow response time alert
        avg_response_time = request_metrics.get("avg_response_time", 0)
        if avg_response_time > 2.0:
            alerts.append(
                {
                    "level": "warning",
                    "type": "slow_response_time",
                    "message": f"Average response time is high: {avg_response_time:.2f}s",
                    "metric": "avg_response_time",
                    "threshold": 2.0,
                    "current_value": avg_response_time,
                }
            )

        # High CPU usage alert
        avg_cpu = system_metrics.get("avg_cpu_percent", 0)
        if avg_cpu > self.high_cpu_threshold:
            alerts.append(
                {
                    "level": "warning",
                    "type": "high_cpu_usage",
                    "message": f"High CPU usage: {avg_cpu}%",
                    "metric": "cpu_percent",
                    "threshold": self.high_cpu_threshold,
                    "current_value": avg_cpu,
                }
            )

        # High memory usage alert
        avg_memory = system_metrics.get("avg_memory_percent", 0)
        if avg_memory > self.high_memory_threshold:
            alerts.append(
                {
                    "level": "warning",
                    "type": "high_memory_usage",
                    "message": f"High memory usage: {avg_memory}%",
                    "metric": "memory_percent",
                    "threshold": self.high_memory_threshold,
                    "current_value": avg_memory,
                }
            )

        return alerts

    def get_traces(self, limit: int = 100) -> list[dict[str, Any]]:
        """Get recent request traces for distributed tracing"""
        # Convert recent requests to trace format
        traces = list(self.request_metrics)[-limit:]
        return traces

    def export_metrics(self, format: str = "json") -> str:
        """Export metrics in specified format"""
        data = {
            "request_metrics": list(self.request_metrics),
            "system_metrics": list(self.system_metrics),
            "error_metrics": list(self.error_metrics),
            "exported_at": datetime.now().isoformat(),
        }

        if format == "json":
            return json.dumps(data, indent=2, default=str)
        else:
            return json.dumps(data, default=str)


# Additional utility functions for API compatibility
def get_apm_summary() -> dict[str, Any]:
    """Get APM summary for dashboard"""
    return apm_service.get_performance_summary(hours=1)


def record_metric(name: str, value: float, tags: dict[str, str] | None = None) -> None:
    """Record a custom metric"""
    apm_service.record_metric(name, value, tags)


def start_span(name: str, tags: dict[str, str] | None = None) -> str:
    """Start a performance span for tracing"""
    return apm_service.start_span(name, tags)


def finish_span(span_id: str, error: str | None = None) -> None:
    """Finish a performance span"""
    apm_service.finish_span(span_id, error)


def create_alert(
    alert_type: str,
    message: str,
    severity: str = "medium",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a performance alert"""
    return apm_service.create_alert(alert_type, message, severity, metadata)


# Global APM instance
apm_service = APMService()


# Middleware for automatic request monitoring
class APMMiddleware:
    """FastAPI middleware for automatic APM monitoring"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()

        # Extract request info
        method = scope["method"]
        path = scope["path"]
        query_string = scope["query_string"].decode()
        headers = dict(scope.get("headers", []))

        # Build full endpoint path
        endpoint = path
        if query_string:
            endpoint += f"?{query_string}"

        # Extract user info from headers
        user_id = None
        session_id = None

        # Try to extract from authorization header or other headers
        auth_header = headers.get(b"authorization", b"").decode()
        if auth_header.startswith("Bearer "):
            # Simplified extraction - decode/verify token if available
            user_id = "anonymous"
            token = auth_header[7:]  # Remove "Bearer " prefix
            try:
                # Import here to avoid circular imports
                from app.services.infrastructure.auth_service import verify_token

                payload = verify_token(token)
                user_id = payload.get("sub", "anonymous")
            except Exception as e:
                logger.warning(f"Failed to decode JWT token: {e}")
                user_id = "anonymous"

        ip_address = None
        for header_name, header_value in headers.items():
            if header_name == b"x-forwarded-for":
                ip_address = header_value.decode().split(",")[0].strip()
                break
            elif header_name == b"x-real-ip":
                ip_address = header_value.decode()
                break

        user_agent = headers.get(b"user-agent", b"").decode()

        # Process request
        response_status = 200
        response_size = 0

        async def send_wrapper(message):
            nonlocal response_status, response_size
            if message["type"] == "http.response.start":
                response_status = message["status"]
            elif message["type"] == "http.response.body":
                response_size = len(message.get("body", b""))
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception:
            response_status = 500
            raise
        finally:
            # Record the request
            duration = time.time() - start_time

            # Record in APM
            apm_service.record_request(
                method=method,
                endpoint=endpoint,
                duration=duration,
                status_code=response_status,
                user_id=user_id,
            )

            # Record in audit log
            audit_service.log_request(
                user_id=user_id,
                session_id=session_id,
                method=method,
                endpoint=endpoint,
                status_code=response_status,
                ip_address=ip_address,
                user_agent=user_agent,
                response_size=response_size,
                processing_time=duration,
            )
