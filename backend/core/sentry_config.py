"""
Sentry Integration for Error Monitoring
Provides error tracking, performance monitoring, and alerting
"""

import logging
import os

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
except ImportError:
    # Dummy mock for environments where sentry-sdk cannot be installed
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("sentry-sdk not installed. Using dummy mocks.")

    class DummySentry:
        def init(self, *args, **kwargs): pass
        def capture_exception(self, *args, **kwargs): pass
        def capture_message(self, *args, **kwargs): pass
        def set_user(self, *args, **kwargs): pass
        def start_transaction(self, *args, **kwargs): 
            class CM:
                def __enter__(self): return self
                def __exit__(self, *args): pass
            return CM()
        def push_scope(self):
            class Scope:
                def __enter__(self): return self
                def __exit__(self, *args): pass
                def set_extra(self, *args, **kwargs): pass
            return Scope()

    sentry_sdk = DummySentry()
    FastApiIntegration = lambda *args, **kwargs: None
    LoggingIntegration = lambda *args, **kwargs: None
    RedisIntegration = lambda *args, **kwargs: None
    SqlalchemyIntegration = lambda *args, **kwargs: None

logger = logging.getLogger(__name__)


def init_sentry():
    """
    Initialize Sentry SDK for error tracking and performance monitoring

    Environment Variables:
        SENTRY_DSN: Sentry Data Source Name (get from sentry.io)
        SENTRY_ENVIRONMENT: Environment name (development/staging/production)
        SENTRY_TRACES_SAMPLE_RATE: Fraction of transactions to trace (0.0 to 1.0)

    Usage:
        Call this function early in application startup (in main.py)
    """
    sentry_dsn = os.getenv("SENTRY_DSN")

    if not sentry_dsn:
        logger.info("Sentry DSN not configured - error tracking disabled")
        return False

    environment = os.getenv("ENVIRONMENT", "development")
    traces_sample_rate = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))

    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=environment,
            # Performance Monitoring
            traces_sample_rate=traces_sample_rate,
            # Integrations
            integrations=[
                FastApiIntegration(
                    transaction_style="endpoint",  # Group by endpoint, not URL
                ),
                SqlalchemyIntegration(),
                RedisIntegration(),
                LoggingIntegration(
                    level=logging.INFO,  # Capture info and above
                    event_level=logging.ERROR,  # Send errors to Sentry
                ),
            ],
            # Release tracking (optional - set in CI/CD)
            release=os.getenv("COMMIT_SHA", None),
            # Additional configuration
            attach_stacktrace=True,
            send_default_pii=False,  # Don't send personally identifiable info
            max_breadcrumbs=50,
            # Error filtering
            before_send=before_send_filter,
        )

        logger.info(
            f"✅ Sentry initialized - Environment: {environment}, Sample Rate: {traces_sample_rate}"
        )
        return True

    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
        return False


def before_send_filter(event, hint):
    """
    Filter events before sending to Sentry

    Filters out:
        - Health check errors
        - Expected 404s
        - Rate limit errors (too noisy)

    Returns:
        event if should send, None to drop
    """
    # Don't send health check errors
    if "request" in event:
        url = event.get("request", {}).get("url", "")
        if "/health" in url:
            return None

    # Don't send expected 404s
    if "exception" in event:
        exc_type = event["exception"]["values"][0].get("type", "")
        if exc_type == "HTTPException":
            # Check status code
            status = event.get("contexts", {}).get("response", {}).get("status_code")
            if status == 404:
                return None

    # Rate limit errors are expected, don't spam Sentry
    if "tags" in event:
        if event["tags"].get("error.type") == "RateLimitExceeded":
            return None

    return event


def capture_exception(error: Exception, context: dict = None):
    """
    Manually capture an exception to Sentry with optional context

    Args:
        error: Exception to capture
        context: Additional context dictionary

    Usage:
        try:
            risky_operation()
        except Exception as e:
            capture_exception(e, {"operation": "payment_processing", "user_id": "123"})
    """
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info", context: dict = None):
    """
    Capture a message to Sentry (for non-exception events)

    Args:
        message: Message to send
        level: Severity level (debug, info, warning, error, fatal)
        context: Additional context

    Usage:
        capture_message("Payment processed successfully", "info", {"amount": 1000})
    """
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level=level)
    else:
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: str = None, username: str = None):
    """
    Set user context for error tracking

    Args:
        user_id: User's unique identifier
        email: User's email (optional)
        username: User's username (optional)

    Usage:
        # In authentication middleware or endpoint
        set_user_context(
            user_id=current_user.id,
            email=current_user.email,
            username=current_user.username
        )
    """
    sentry_sdk.set_user({"id": user_id, "email": email, "username": username})


def clear_user_context():
    """Clear user context (e.g., after logout)"""
    sentry_sdk.set_user(None)


# Convenience function for route-level error tracking
def track_endpoint(endpoint_name: str):
    """
    Decorator to track endpoint performance and errors

    Usage:
        @track_endpoint("create_case")
        async def create_case(...):
            ...
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            with sentry_sdk.start_transaction(op="endpoint", name=endpoint_name):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    capture_exception(
                        e,
                        {
                            "endpoint": endpoint_name,
                            "args": str(args)[:200],  # Truncate for safety
                        },
                    )
                    raise

        return wrapper

    return decorator
