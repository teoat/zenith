"""
Circuit Breaker Pattern for Service Resilience
Implements robust circuit breaker with configurable states and metrics
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitMetrics:
    """Circuit breaker metrics"""

    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    rejected_calls: int = 0
    last_failure_time: datetime | None = None
    last_success_time: datetime | None = None
    total_duration_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "rejected_calls": self.rejected_calls,
            "success_rate": round(self.successful_calls / self.total_calls * 100, 2)
            if self.total_calls > 0
            else 0,
            "avg_duration_ms": round(self.total_duration_ms / self.total_calls, 2)
            if self.total_calls > 0
            else 0,
            "last_failure_time": self.last_failure_time.isoformat()
            if self.last_failure_time
            else None,
            "last_success_time": self.last_success_time.isoformat()
            if self.last_success_time
            else None,
        }


@dataclass
class CircuitConfig:
    """Circuit breaker configuration"""

    failure_threshold: int = 5
    success_threshold: int = 3
    recovery_timeout: float = 60.0
    half_open_max_calls: int = 3
    timeout: float = 30.0


class CircuitBreaker:
    """
    Robust circuit breaker implementation with three states:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Service is down, requests are rejected immediately
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    """

    def __init__(self, name: str, config: CircuitConfig | None = None):
        self.name = name
        self.config = config or CircuitConfig()
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = 0.0
        self._next_attempt_time = 0.0
        self._half_open_calls = 0
        self._lock = asyncio.Lock()
        self._metrics = CircuitMetrics()

    @property
    def state(self) -> CircuitState:
        """Get current circuit state"""
        if self._state == CircuitState.OPEN:
            if time.time() >= self._next_attempt_time:
                return CircuitState.HALF_OPEN
        return self._state

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        async with self._lock:
            # Sync internal state if it has timed out
            calculated_state = self.state
            if self._state == CircuitState.OPEN and calculated_state == CircuitState.HALF_OPEN:
                self._state = CircuitState.HALF_OPEN

            current_state = self._state

            if current_state == CircuitState.OPEN:
                self._metrics.rejected_calls += 1
                raise CircuitOpenError(f"Circuit breaker open for {self.name}")

            if current_state == CircuitState.HALF_OPEN:
                if self._half_open_calls >= self.config.half_open_max_calls:
                    self._metrics.rejected_calls += 1
                    raise CircuitOpenError(
                        f"Circuit breaker half-open limit reached for {self.name}"
                    )
                self._half_open_calls += 1

        start_time = time.time()
        self._metrics.total_calls += 1

        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            duration = (time.time() - start_time) * 1000
            await self._on_success(duration)
            return result

        except asyncio.TimeoutError:
            await self._on_failure("timeout")
            raise CircuitTimeoutError(f"Circuit breaker timeout for {self.name}")

        except Exception as e:
            await self._on_failure(str(e))
            raise CircuitError(f"Circuit breaker error for {self.name}: {e}")

    async def _on_success(self, duration_ms: float):
        """Handle successful call"""
        async with self._lock:
            self._metrics.successful_calls += 1
            self._metrics.total_duration_ms += duration_ms
            self._metrics.last_success_time = datetime.now()

            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.config.success_threshold:
                    await self._transition_to_closed()

            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0

    async def _on_failure(self, error_type: str):
        """Handle failed call"""
        async with self._lock:
            self._metrics.failed_calls += 1
            self._metrics.last_failure_time = datetime.now()
            self._last_failure_time = time.time()

            if self._state == CircuitState.CLOSED:
                self._failure_count += 1
                if self._failure_count >= self.config.failure_threshold:
                    await self._transition_to_open()

            elif self._state == CircuitState.HALF_OPEN:
                await self._transition_to_open()

    async def _transition_to_open(self):
        """Transition to OPEN state"""
        self._state = CircuitState.OPEN
        self._next_attempt_time = time.time() + self.config.recovery_timeout
        self._half_open_calls = 0
        self._success_count = 0
        logger.warning(f"Circuit breaker '{self.name}' opened")

    async def _transition_to_closed(self):
        """Transition to CLOSED state"""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        logger.info(f"Circuit breaker '{self.name}' closed")

    def get_metrics(self) -> CircuitMetrics:
        """Get circuit metrics"""
        return self._metrics

    def get_state(self) -> dict[str, Any]:
        """Get circuit state information"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "next_attempt_at": self._next_attempt_time
            if self._state == CircuitState.OPEN
            else None,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "success_threshold": self.config.success_threshold,
            },
            "metrics": self._metrics.to_dict(),
        }

    def reset(self):
        """Reset circuit breaker to initial state"""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = 0.0
        self._next_attempt_time = 0.0
        self._half_open_calls = 0
        self._metrics = CircuitMetrics()
        logger.info(f"Circuit breaker '{self.name}' reset")


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open"""

    pass


class CircuitTimeoutError(Exception):
    """Raised when circuit breaker times out"""

    pass


class CircuitError(Exception):
    """Raised when circuit breaker encounters an error"""

    pass


class CircuitBreakerManager:
    """
    Manager for multiple circuit breakers
    """

    def __init__(self):
        self._breakers: dict[str, CircuitBreaker] = {}
        self._lock = asyncio.Lock()

    def get_or_create(
        self, name: str, config: CircuitConfig | None = None
    ) -> CircuitBreaker:
        """Get existing or create new circuit breaker"""
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(name, config)
        return self._breakers[name]

    def get(self, name: str) -> CircuitBreaker | None:
        """Get circuit breaker by name"""
        return self._breakers.get(name)

    def remove(self, name: str):
        """Remove circuit breaker"""
        self._breakers.pop(name, None)

    def get_all_states(self) -> list[dict[str, Any]]:
        """Get state of all circuit breakers"""
        return [breaker.get_state() for breaker in self._breakers.values()]

    def reset_all(self):
        """Reset all circuit breakers"""
        for breaker in self._breakers.values():
            breaker.reset()

    def get_all_metrics(self) -> dict[str, dict[str, Any]]:
        """Get metrics for all circuit breakers"""
        return {
            name: breaker.get_metrics().to_dict()
            for name, breaker in self._breakers.items()
        }


# Global circuit breaker manager
circuit_breaker_manager = CircuitBreakerManager()
