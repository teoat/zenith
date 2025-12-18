"""Minimal monitoring service used by tests and the application.
Provides basic system metrics collection and error tracking with safe
fallbacks for environments where `psutil` or Prometheus are unavailable.
"""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict, deque
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import json
import atexit
import os
from pathlib import Path

try:
    import psutil
except Exception:
    psutil = None

from core.logging import logger

# Prometheus client optional
try:
    from prometheus_client import generate_latest

    PROMETHEUS_AVAILABLE = True
except Exception:
    PROMETHEUS_AVAILABLE = False


@dataclass
class Metric:
    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str]
    metric_type: str = "gauge"


@dataclass
class PerformanceSnapshot:
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    disk_usage_percent: float
    network_connections: int
    active_threads: int
    request_count: int
    error_count: int
    response_time_avg: float


@dataclass
class ErrorEvent:
    timestamp: datetime
    error_type: str
    message: str
    stack_trace: str
    user_id: Optional[str]
    session_id: Optional[str]
    metadata: Dict[str, Any]


class MonitoringService:
    """A small, test-friendly monitoring service implementation."""

    def __init__(self, retention_hours: int = 24, metrics_interval: int = 60):
        self.retention_hours = retention_hours
        self.metrics_interval = metrics_interval

        # Storage
        self.metrics: List[Metric] = []
        self.performance_history: deque[PerformanceSnapshot] = deque(maxlen=10000)
        self.error_events: List[ErrorEvent] = []

        # Counters
        self.request_count = 0
        self.error_count = 0
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.response_times: deque[float] = deque(maxlen=1000)

        # Locks
        self.metrics_lock = threading.Lock()
        self.performance_lock = threading.Lock()
        self.errors_lock = threading.Lock()

        # Optional Prometheus holder
        self.prometheus_metrics = None

        # Thresholds
        self.alert_thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "error_rate": 5.0,
            "response_time_avg": 2000.0,
        }
        
        # Persistence
        self.state_file = Path("monitoring_state.json")
        self._load_state()
        atexit.register(self._save_state)

    def _save_state(self):
        """Save current monitoring state to disk"""
        try:
            data = {
                "performance_history": [asdict(s) for s in self.performance_history],
                "error_events": [asdict(e) for e in self.error_events][-100:], # keep last 100 errors
                "request_count": self.request_count,
                "error_count": self.error_count,
                "error_counts": self.error_counts,
                "saved_at": datetime.now().isoformat()
            }
            # Simple atomic write
            temp_file = self.state_file.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(data, f, default=str)
            os.replace(temp_file, self.state_file)
            # Only log if logging system is still alive
            if logging.getLogger().handlers:
                logger.info("Saved monitoring state to disk")
        except ReferenceError:
             pass # Logging system likely shut down
        except ValueError:
             pass # I/O operation on closed file
        except Exception as e:
            # Try to log but fail silently if logger is dead
            try: logger.error(f"Failed to save monitoring state: {e}")
            except: pass

    def _load_state(self):
        """Load monitoring state from disk"""
        if not self.state_file.exists():
            return
        
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
            
            # Restore counters
            self.request_count = data.get("request_count", 0)
            self.error_count = data.get("error_count", 0)
            self.error_counts = defaultdict(int, data.get("error_counts", {}))
            
            # Restore history (convert strings back to datetime/objects where needed)
            # For simplicity in this demo-ware upgrade, we might just load raw dicts 
            # or reconstruct objects. Reconstructing is safer.
            if "performance_history" in data:
                for item in data["performance_history"]:
                    # Basic reconstruction
                    try:
                         if isinstance(item.get("timestamp"), str):
                             item["timestamp"] = datetime.fromisoformat(item["timestamp"])
                         self.performance_history.append(PerformanceSnapshot(**item))
                    except:
                        pass
                        
            if "error_events" in data:
                for item in data["error_events"]:
                    try:
                        if isinstance(item.get("timestamp"), str):
                             item["timestamp"] = datetime.fromisoformat(item["timestamp"])
                        self.error_events.append(ErrorEvent(**item))
                    except:
                        pass
                        
            logger.info("Restored monitoring state from disk")
        except Exception as e:
            logger.error(f"Failed to load monitoring state: {e}")

    # --- collection & helpers ---
    def _safe_psutil(self, fn, *args, default=None, **kwargs):
        try:
            if psutil is None:
                return default
            return fn(*args, **kwargs)
        except Exception:
            return default

    def _collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system metrics and return a lightweight dict. Always returns a dict.
        Tests patch `psutil.cpu_percent` and `psutil.virtual_memory` so this method
        must be resilient when some functions are mocked and others are not.
        """
        cpu_percent = self._safe_psutil(getattr, psutil, "cpu_percent", default=0.0)
        if callable(cpu_percent):
            try:
                cpu_percent = cpu_percent(interval=0.1)
            except Exception:
                cpu_percent = 0.0
        else:
            cpu_percent = float(cpu_percent or 0.0)

        memory = self._safe_psutil(getattr, psutil, "virtual_memory", default=None)
        if callable(memory):
            try:
                mem = memory()
                memory_percent = getattr(mem, "percent", 0.0)
                memory_used_mb = getattr(mem, "used", 0) / 1024 / 1024
            except Exception:
                memory_percent = 0.0
                memory_used_mb = 0.0
        else:
            memory_percent = 0.0
            memory_used_mb = 0.0

        disk_usage = self._safe_psutil(getattr, psutil, "disk_usage", default=None)
        if callable(disk_usage):
            try:
                disk = disk_usage("/")
                disk_usage_percent = getattr(disk, "percent", 0.0)
            except Exception:
                disk_usage_percent = 0.0
        else:
            disk_usage_percent = 0.0

        net_conn = self._safe_psutil(getattr, psutil, "net_connections", default=None)
        if callable(net_conn):
            try:
                network_connections = len(net_conn())
            except Exception:
                network_connections = 0
        else:
            network_connections = 0

        try:
            active_threads = threading.active_count()
        except Exception:
            active_threads = 0

        response_time_avg = (
            sum(self.response_times) / len(self.response_times)
            if self.response_times
            else 0.0
        )

        snapshot = PerformanceSnapshot(
            timestamp=datetime.now(),
            cpu_percent=float(cpu_percent),
            memory_percent=float(memory_percent),
            memory_used_mb=float(memory_used_mb),
            disk_usage_percent=float(disk_usage_percent),
            network_connections=int(network_connections),
            active_threads=int(active_threads),
            request_count=self.request_count,
            error_count=self.error_count,
            response_time_avg=float(response_time_avg),
        )

        with self.performance_lock:
            self.performance_history.append(snapshot)

        # Record lightweight metrics
        self.record_metric(
            "system.cpu_percent", snapshot.cpu_percent, {"type": "system"}
        )
        self.record_metric(
            "system.memory_percent", snapshot.memory_percent, {"type": "system"}
        )
        self.record_metric(
            "system.disk_usage_percent", snapshot.disk_usage_percent, {"type": "system"}
        )
        self.record_metric(
            "app.request_count", snapshot.request_count, {"type": "application"}
        )
        self.record_metric(
            "app.error_count", snapshot.error_count, {"type": "application"}
        )

        return {
            "cpu_usage": snapshot.cpu_percent,
            "memory_percent": snapshot.memory_percent,
            "memory_usage": snapshot.memory_percent,
            "disk_usage_percent": snapshot.disk_usage_percent,
            "network_connections": snapshot.network_connections,
            "active_threads": snapshot.active_threads,
            "request_count": snapshot.request_count,
            "error_count": snapshot.error_count,
            "response_time_avg": snapshot.response_time_avg,
        }

    def record_metric(
        self,
        name: str,
        value: float,
        tags: Dict[str, str] = None,
        metric_type: str = "gauge",
    ):
        if tags is None:
            tags = {}
        m = Metric(
            name=name,
            value=value,
            timestamp=datetime.now(),
            tags=tags,
            metric_type=metric_type,
        )
        with self.metrics_lock:
            self.metrics.append(m)

    def record_request(
        self,
        response_time: float,
        status_code: int = 200,
        method: str = "GET",
        endpoint: str = "/",
    ):
        self.request_count += 1
        with self.metrics_lock:
            self.response_times.append(response_time)

    def record_error(
        self, error_type: str, message: str, metadata: Dict[str, Any] = None
    ):
        if metadata is None:
            metadata = {}
        self.error_count += 1
        ev = ErrorEvent(
            timestamp=datetime.now(),
            error_type=error_type,
            message=message,
            stack_trace="",
            user_id=metadata.get("user_id"),
            session_id=metadata.get("session_id"),
            metadata=metadata,
        )
        with self.errors_lock:
            self.error_events.append(ev)
            self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        logger.error(f"Recorded error: {error_type} - {message}")

    def get_health_metrics(self) -> Dict[str, Any]:
        latest = None
        with self.performance_lock:
            if self.performance_history:
                latest = self.performance_history[-1]

        # Calculate simplified health score
        score = 100
        if latest:
            if latest.cpu_percent > 90:
                score -= 20
            if latest.memory_percent > 90:
                score -= 20
            if latest.error_count > 50:
                score -= 20

        return {
            "error_counts": dict(self.error_counts),
            "performance_metrics": asdict(latest) if latest else {},
            "system_health": max(0, score),
            "uptime_seconds": (
                (time.time() - psutil.boot_time())
                if (psutil and hasattr(psutil, "boot_time"))
                else 0
            ),
        }

    # Backwards-compatible API expected by older tests
    def get_system_status(self) -> Dict[str, Any]:
        """Legacy alias used by tests/routers for system status."""
        return {
            "status": (
                "healthy"
                if (self.get_health_metrics().get("performance_metrics"))
                else "unhealthy"
            ),
            "health_metrics": self.get_health_metrics(),
        }

    def start_monitoring(self):
        """Start background monitoring. For tests this is a no-op but present."""
        # No background thread required for unit tests; keep API stable.
        return None

    def get_metrics(
        self, metric_name: str = None, hours: int = 1
    ) -> List[Dict[str, Any]]:
        cutoff = datetime.now() - timedelta(hours=hours)
        with self.metrics_lock:
            return [
                asdict(m)
                for m in self.metrics
                if m.timestamp > cutoff
                and (metric_name is None or m.name == metric_name)
            ]

    def get_performance_history(self, hours: int = 1) -> List[Dict[str, Any]]:
        cutoff = datetime.now() - timedelta(hours=hours)
        with self.performance_lock:
            return [asdict(s) for s in self.performance_history if s.timestamp > cutoff]

    def get_error_summary(self, hours: int = 24) -> Dict[str, Any]:
        cutoff = datetime.now() - timedelta(hours=hours)
        with self.errors_lock:
            recent = [e for e in self.error_events if e.timestamp > cutoff]
        types = defaultdict(int)
        for e in recent:
            types[e.error_type] += 1
        return {
            "total_errors": len(recent),
            "error_types": dict(types),
            "recent_errors": [asdict(e) for e in recent[-10:]],
        }

    def get_dashboard_data(self) -> Dict[str, Any]:
        return {
            "system_status": self.get_health_metrics(),
            "performance_history": self.get_performance_history(hours=24),
            "error_summary": self.get_error_summary(hours=24),
            "key_metrics": {
                "total_requests": self.request_count,
                "total_errors": self.error_count,
                "avg_response_time": (
                    (sum(self.response_times) / len(self.response_times))
                    if self.response_times
                    else 0
                ),
                "uptime_seconds": (
                    (time.time() - psutil.boot_time())
                    if (psutil and hasattr(psutil, "boot_time"))
                    else None
                ),
            },
        }

    def get_prometheus_metrics(self) -> str:
        if not PROMETHEUS_AVAILABLE:
            return "# Prometheus metrics not available"
        try:
            return generate_latest()
        except Exception:
            return "# failed to generate metrics"


# Single instance used by routers/tests
monitoring_service = MonitoringService()


def create_monitoring_middleware():
    from fastapi import Request

    async def middleware(request: Request, call_next):
        start = time.time()
        try:
            resp = await call_next(request)
            rt = (time.time() - start) * 1000
            monitoring_service.record_request(rt, resp.status_code)
            return resp
        except Exception as e:
            rt = (time.time() - start) * 1000
            monitoring_service.record_request(rt, 500)
            monitoring_service.record_error(
                "unhandled_exception",
                str(e),
                {"path": str(request.url), "method": request.method},
            )
            raise

    return middleware

    return monitoring_middleware
