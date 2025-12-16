"""
Database Query Performance Monitoring

This module provides query timing, slow query logging, and performance metrics
for database operations.
"""

import functools
import time
from typing import Any, Callable

from prometheus_client import Counter, Histogram

from core.logging import logger

# Prometheus metrics
query_duration = Histogram(
    "db_query_duration_seconds", "Database query execution time", ["operation", "table"]
)

slow_query_counter = Counter(
    "db_slow_queries_total",
    "Number of slow database queries (>1s)",
    ["operation", "table"],
)

query_error_counter = Counter(
    "db_query_errors_total",
    "Number of database query errors",
    ["operation", "error_type"],
)

# Slow query threshold (seconds)
SLOW_QUERY_THRESHOLD = 1.0


def monitor_query(operation: str, table: str = "unknown"):
    """
    Decorator to monitor database query performance.

    Usage:
        @monitor_query("select", "cases")
        def get_cases(db):
            return db.query(Case).all()

    Args:
        operation: Type of database operation (select, insert, update, delete)
        table: Database table name being queried
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            error_occurred = False
            error_type = None

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                error_occurred = True
                error_type = type(e).__name__
                query_error_counter.labels(
                    operation=operation, error_type=error_type
                ).inc()

                logger.error(
                    f"Database query error",
                    extra={
                        "operation": operation,
                        "table": table,
                        "error": str(e),
                        "error_type": error_type,
                    },
                )
                raise
            finally:
                duration = time.time() - start_time

                # Record duration metric
                query_duration.labels(operation=operation, table=table).observe(
                    duration
                )

                # Log slow queries
                if duration > SLOW_QUERY_THRESHOLD:
                    slow_query_counter.labels(operation=operation, table=table).inc()

                    logger.warning(
                        f"Slow query detected",
                        extra={
                            "operation": operation,
                            "table": table,
                            "duration_seconds": round(duration, 3),
                            "threshold_seconds": SLOW_QUERY_THRESHOLD,
                            "function": func.__name__,
                        },
                    )

                # Log all queries in debug mode
                logger.debug(
                    f"Query executed",
                    extra={
                        "operation": operation,
                        "table": table,
                        "duration_seconds": round(duration, 4),
                        "success": not error_occurred,
                    },
                )

        return wrapper

    return decorator


def get_query_metrics():
    """
    Get current query performance metrics.

    Returns:
        dict: Query performance statistics
    """
    # This would typically aggregate from Prometheus
    # For now, return basic stats
    return {
        "slow_queries": {
            "threshold_seconds": SLOW_QUERY_THRESHOLD,
            "description": "Queries exceeding threshold are logged and counted",
        },
        "metrics_available": [
            "db_query_duration_seconds (histogram)",
            "db_slow_queries_total (counter)",
            "db_query_errors_total (counter)",
        ],
    }


class QueryPerformanceContext:
    """
    Context manager for monitoring query performance.

    Usage:
        with QueryPerformanceContext("select", "cases") as qpc:
            results = db.query(Case).all()
    """

    def __init__(self, operation: str, table: str = "unknown"):
        self.operation = operation
        self.table = table
        self.start_time = None
        self.duration = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration = time.time() - self.start_time

        # Record metrics
        query_duration.labels(operation=self.operation, table=self.table).observe(
            self.duration
        )

        # Check for slow query
        if self.duration > SLOW_QUERY_THRESHOLD:
            slow_query_counter.labels(operation=self.operation, table=self.table).inc()

            logger.warning(
                f"Slow query in context",
                extra={
                    "operation": self.operation,
                    "table": self.table,
                    "duration_seconds": round(self.duration, 3),
                },
            )

        # Log errors
        if exc_type is not None:
            query_error_counter.labels(
                operation=self.operation, error_type=exc_type.__name__
            ).inc()

            logger.error(
                f"Query error in context",
                extra={
                    "operation": self.operation,
                    "table": self.table,
                    "error_type": exc_type.__name__,
                    "error": str(exc_val),
                },
            )

        return False  # Don't suppress exceptions
