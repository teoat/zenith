"""
Performance monitoring middleware
"""

import time
from functools import wraps
from typing import Callable, Any
from core.logging import logger


def performance_monitor(func: Callable) -> Callable:
    """
    Decorator to monitor function performance
    """

    @wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time

            # Log slow operations
            if duration > 1.0:
                logger.warning(
                    f"Slow operation: {func.__name__} took {duration:.2f}s",
                    extra={
                        "operation": func.__name__,
                        "duration": duration,
                        "args_count": len(args),
                        "kwargs_count": len(kwargs),
                    },
                )
            elif duration > 0.1:
                logger.info(f"Operation completed: {func.__name__} in {duration:.3f}s")

            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Operation failed: {func.__name__} after {duration:.2f}s - {e}",
                extra={"operation": func.__name__, "duration": duration, "error": str(e)},
            )
            raise

    return wrapper


def database_query_monitor(func: Callable) -> Callable:
    """
    Decorator to monitor database query performance
    """

    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time

            # Log slow database operations
            if duration > 0.5:
                logger.warning(
                    f"Slow database operation: {func.__name__} took {duration:.3f}s",
                    extra={"operation": func.__name__, "duration": duration, "query_type": "database"},
                )

            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Database operation failed: {func.__name__} after {duration:.3f}s - {e}",
                extra={"operation": func.__name__, "duration": duration, "error": str(e), "query_type": "database"},
            )
            raise

    return wrapper


class PerformanceTracker:
    """
    Tracks application performance metrics
    """

    def __init__(self):
        self.metrics = {"requests_total": 0, "requests_duration_sum": 0.0, "errors_total": 0, "slow_requests": 0}

    def record_request(self, duration: float, status_code: int):
        """Record HTTP request metrics"""
        self.metrics["requests_total"] += 1
        self.metrics["requests_duration_sum"] += duration

        if duration > 5.0:  # Slow request threshold
            self.metrics["slow_requests"] += 1

        if status_code >= 400:
            self.metrics["errors_total"] += 1

    def get_average_response_time(self) -> float:
        """Calculate average response time"""
        if self.metrics["requests_total"] == 0:
            return 0.0
        return self.metrics["requests_duration_sum"] / self.metrics["requests_total"]

    def get_error_rate(self) -> float:
        """Calculate error rate percentage"""
        if self.metrics["requests_total"] == 0:
            return 0.0
        return (self.metrics["errors_total"] / self.metrics["requests_total"]) * 100

    def get_metrics_summary(self) -> dict:
        """Get comprehensive metrics summary"""
        return {
            **self.metrics,
            "average_response_time": self.get_average_response_time(),
            "error_rate": self.get_error_rate(),
            "slow_request_rate": (self.metrics["slow_requests"] / max(self.metrics["requests_total"], 1)) * 100,
        }


# Global performance tracker instance
performance_tracker = PerformanceTracker()
