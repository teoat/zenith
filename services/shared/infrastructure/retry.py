"""
Retry Mechanism with Exponential Backoff
Implements robust retry logic with jitter and configurable policies
"""

import asyncio
import logging
import random
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger(__name__)


class RetryStrategy(Enum):
    FIXED = "fixed"
    LINEAR = "linear"
    EXPONENTIAL = "exponential"
    EXPONENTIAL_JITTER = "exponential_jitter"


@dataclass
class RetryConfig:
    """Retry configuration"""

    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter_factor: float = 0.1
    retry_strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_JITTER
    retry_on_exceptions: tuple[type[Exception], ...] = (Exception,)


@dataclass
class RetryMetrics:
    """Retry operation metrics"""

    total_attempts: int = 0
    successful_first_attempt: int = 0
    successful_retries: int = 0
    failed_after_retries: int = 0
    total_delay_ms: float = 0.0
    last_attempt_time: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_attempts": self.total_attempts,
            "successful_first_attempt": self.successful_first_attempt,
            "successful_retries": self.successful_retries,
            "failed_after_retries": self.failed_after_retries,
            "success_rate": round(
                (self.successful_first_attempt + self.successful_retries)
                / self.total_attempts
                * 100,
                2,
            )
            if self.total_attempts > 0
            else 0,
            "total_delay_ms": round(self.total_delay_ms, 2),
            "last_attempt_time": self.last_attempt_time.isoformat()
            if self.last_attempt_time
            else None,
        }


class RetryPolicy:
    """
    Configurable retry policy with multiple strategies
    """

    def __init__(self, config: RetryConfig | None = None):
        self.config = config or RetryConfig()

    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number"""
        if self.config.retry_strategy == RetryStrategy.FIXED:
            return self.config.base_delay

        elif self.config.retry_strategy == RetryStrategy.LINEAR:
            return min(self.config.base_delay * attempt, self.config.max_delay)

        elif self.config.retry_strategy == RetryStrategy.EXPONENTIAL:
            delay = self.config.base_delay * (self.config.exponential_base**attempt)
            return min(delay, self.config.max_delay)

        elif self.config.retry_strategy == RetryStrategy.EXPONENTIAL_JITTER:
            delay = self.config.base_delay * (self.config.exponential_base**attempt)
            jitter = delay * self.config.jitter_factor * random.random()
            return min(delay + jitter, self.config.max_delay)

        return self.config.base_delay

    def should_retry(self, attempt: int, exception: Exception) -> bool:
        """Determine if should retry based on exception type"""
        if attempt >= self.config.max_attempts:
            return False
        return isinstance(exception, self.config.retry_on_exceptions)


class Retryable:
    """
    Retry wrapper for async functions with configurable policies
    """

    def __init__(self, config: RetryConfig | None = None):
        self.config = config or RetryConfig()
        self.policy = RetryPolicy(self.config)
        self._metrics = RetryMetrics()

    async def execute(
        self,
        func: Callable,
        *args,
        operation_name: str = "unknown",
        **kwargs,
    ) -> tuple[Any, int]:
        """
        Execute function with retry logic

        Returns:
            Tuple of (result, attempts_made)
        """
        last_exception = None

        for attempt in range(self.config.max_attempts):
            self._metrics.total_attempts += 1
            start_time = time.time()

            try:
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)

                delay = (time.time() - start_time) * 1000
                self._metrics.total_delay_ms += delay
                self._metrics.last_attempt_time = datetime.now()

                if attempt == 0:
                    self._metrics.successful_first_attempt += 1
                else:
                    self._metrics.successful_retries += 1

                logger.debug(
                    f"Operation '{operation_name}' succeeded on attempt {attempt + 1}"
                )
                return result, attempt + 1

            except Exception as e:
                last_exception = e
                delay = (time.time() - start_time) * 1000
                self._metrics.total_delay_ms += delay

                if not self.policy.should_retry(attempt + 1, e):
                    logger.warning(
                        f"Operation '{operation_name}' failed after {attempt + 1} attempts: {e}"
                    )
                    self._metrics.failed_after_retries += 1
                    raise

                retry_delay = self.policy.calculate_delay(attempt)

                logger.debug(
                    f"Operation '{operation_name}' failed (attempt {attempt + 1}), "
                    f"retrying in {retry_delay:.2f}s: {e}"
                )

                await asyncio.sleep(retry_delay)

        self._metrics.failed_after_retries += 1
        raise last_exception

    def get_metrics(self) -> RetryMetrics:
        """Get retry metrics"""
        return self._metrics


class AsyncRetryable:
    """
    Async context manager for retry operations
    """

    def __init__(self, config: RetryConfig | None = None):
        self.config = config or RetryConfig()
        self.policy = RetryPolicy(self.config)
        self._metrics = RetryMetrics()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def attempt(
        self,
        func: Callable,
        *args,
        operation_name: str = "unknown",
        **kwargs,
    ) -> tuple[Any, int]:
        """Execute function with retry logic"""
        retryable = Retryable(self.config)
        return await retryable.execute(
            func, *args, operation_name=operation_name, **kwargs
        )

    def get_metrics(self) -> RetryMetrics:
        """Get retry metrics"""
        return self._metrics


def with_retry(
    config: RetryConfig | None = None,
    max_attempts: int | None = None,
    base_delay: float | None = None,
    retry_strategy: RetryStrategy | None = None,
):
    """
    Decorator for adding retry logic to functions

    Usage:
        @with_retry(max_attempts=3, base_delay=1.0, retry_strategy=RetryStrategy.EXPONENTIAL_JITTER)
        async def my_function():
            ...
    """

    def decorator(func: Callable) -> Callable:
        retry_config = config or RetryConfig()
        if max_attempts:
            retry_config.max_attempts = max_attempts
        if base_delay:
            retry_config.base_delay = base_delay
        if retry_strategy:
            retry_config.retry_strategy = retry_strategy

        async def async_wrapper(*args, **kwargs):
            retryable = Retryable(retry_config)
            result, _ = await retryable.execute(
                func, *args, operation_name=func.__name__, **kwargs
            )
            return result

        def sync_wrapper(*args, **kwargs):
            retryable = Retryable(retry_config)
            result, _ = asyncio.run(
                retryable.execute(func, *args, operation_name=func.__name__, **kwargs)
            )
            return result

        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


# Pre-configured retry policies
DEFAULT_RETRY = RetryConfig(
    max_attempts=3,
    base_delay=1.0,
    retry_strategy=RetryStrategy.EXPONENTIAL_JITTER,
)

AGGRESSIVE_RETRY = RetryConfig(
    max_attempts=5,
    base_delay=0.5,
    retry_strategy=RetryStrategy.EXPONENTIAL_JITTER,
)

CONSERVATIVE_RETRY = RetryConfig(
    max_attempts=3,
    base_delay=2.0,
    max_delay=120.0,
    retry_strategy=RetryStrategy.EXPONENTIAL_JITTER,
)
