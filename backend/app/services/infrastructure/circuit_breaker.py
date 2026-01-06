"""
Circuit Breaker implementation for backend services
Provides fault tolerance for database operations and external API calls
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5  # Number of failures before opening
    recovery_timeout: float = 60.0  # Seconds to wait before trying again
    expected_exception: tuple = (Exception,)  # Exception types to catch
    success_threshold: int = 3  # Successes needed in half-open state
    timeout: float = 30.0  # Operation timeout


class CircuitBreaker:
    """Circuit breaker implementation for fault tolerance"""

    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()

        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: float | None = None

        self._lock = asyncio.Lock()

    async def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return False
        return time.time() - self.last_failure_time >= self.config.recovery_timeout

    async def _record_success(self):
        """Record a successful operation"""
        async with self._lock:
            if self.state == CircuitBreakerState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.config.success_threshold:
                    self._reset()
            elif self.state == CircuitBreakerState.CLOSED:
                self.failure_count = max(0, self.failure_count - 1)  # Decay failures

    async def _record_failure(self):
        """Record a failed operation"""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.config.failure_threshold:
                self.state = CircuitBreakerState.OPEN
                logger.warning(
                    f"Circuit breaker '{self.name}' opened after {self.failure_count} failures"
                )

    def _reset(self):
        """Reset circuit breaker to closed state"""
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        logger.info(f"Circuit breaker '{self.name}' reset to closed state")

    def _can_attempt(self) -> bool:
        """Check if operation can be attempted - sync version"""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            # For sync check, we use current time without awaiting
            if self.last_failure_time is None:
                return False
            return time.time() - self.last_failure_time >= self.config.recovery_timeout
        else:  # HALF_OPEN
            return True

    def attempt_operation_sync(self):
        """Sync context manager for circuit breaker protected operations"""
        from contextlib import contextmanager

        @contextmanager
        def sync_context():
            if not self._can_attempt():
                raise CircuitBreakerOpenException(
                    f"Circuit breaker '{self.name}' is open"
                )

            if self.state == CircuitBreakerState.OPEN:
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"Circuit breaker '{self.name}' entering half-open state")

            try:
                yield
                # Record success in a way that doesn't block (or just skip for sync if risk is low)
                # For SQLite, the risk is low. For 99.99% uptime, we should ideally use a threadsafe non-async counter.
                if self.state == CircuitBreakerState.HALF_OPEN:
                    self.success_count += 1
                    if self.success_count >= self.config.success_threshold:
                        self._reset()
                elif self.state == CircuitBreakerState.CLOSED:
                    self.failure_count = max(0, self.failure_count - 1)
            except self.config.expected_exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()
                if self.failure_count >= self.config.failure_threshold:
                    self.state = CircuitBreakerState.OPEN
                    logger.warning(
                        f"Circuit breaker '{self.name}' opened after {self.failure_count} failures"
                    )
                raise e

        return sync_context()

    @asynccontextmanager
    async def attempt_operation(self):
        """Context manager for circuit breaker protected operations"""
        if not self._can_attempt():
            raise CircuitBreakerOpenException(f"Circuit breaker '{self.name}' is open")

        if self.state == CircuitBreakerState.OPEN:
            self.state = CircuitBreakerState.HALF_OPEN
            logger.info(f"Circuit breaker '{self.name}' entering half-open state")

        try:
            yield
            await self._record_success()
        except self.config.expected_exception as e:
            await self._record_failure()
            raise e

    def get_status(self) -> dict[str, Any]:
        """Get circuit breaker status"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "success_threshold": self.config.success_threshold,
                "timeout": self.config.timeout,
            },
        }


class CircuitBreakerOpenException(Exception):
    """Exception raised when circuit breaker is open"""


# Global circuit breaker registry
_circuit_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str, config: CircuitBreakerConfig = None
) -> CircuitBreaker:
    """Get or create a circuit breaker instance"""
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(name, config)
    return _circuit_breakers[name]


def get_all_circuit_breakers() -> dict[str, dict[str, Any]]:
    """Get status of all circuit breakers"""
    return {name: cb.get_status() for name, cb in _circuit_breakers.items()}


# Decorator for circuit breaker protection
def circuit_breaker(name: str, config: CircuitBreakerConfig = None):
    """Decorator to apply circuit breaker protection to both sync and async functions"""
    cb = get_circuit_breaker(name, config)
    import functools
    import inspect

    def decorator(func):
        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                async with cb.attempt_operation():
                    return await func(*args, **kwargs)

            return async_wrapper
        else:

            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                with cb.attempt_operation_sync():
                    return func(*args, **kwargs)

            return sync_wrapper

    return decorator
