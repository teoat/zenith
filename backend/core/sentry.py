"""Sentry error tracking integration"""

import os

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration


def init_sentry():
    """Initialize Sentry error tracking"""
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "production")

    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=environment,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
            traces_sample_rate=0.1 if environment == "production" else 1.0,
            # Send error events
            send_default_pii=False,  # Don't send PII by default
            # Set profiles_sample_rate to profile 10% of sampled transactions
            profiles_sample_rate=0.1,
            # Before send callback to filter sensitive data
            before_send=before_send_handler,
        )

        print(f"✅ Sentry initialized for environment: {environment}")
    else:
        print("⚠️  Sentry DSN not configured, error tracking disabled")


def before_send_handler(event, hint):
    """Filter sensitive data before sending to Sentry"""
    # Remove sensitive headers
    if "request" in event and "headers" in event["request"]:
        headers = event["request"]["headers"]
        if "Authorization" in headers:
            headers["Authorization"] = "[Filtered]"
        if "Cookie" in headers:
            headers["Cookie"] = "[Filtered]"

    # Remove sensitive query parameters
    if "request" in event and "query_string" in event["request"]:
        # Filter passwords, tokens, etc.
        pass

    return event


def capture_exception(error: Exception, context: dict = None):
    """Manually capture an exception with context"""
    with sentry_sdk.push_scope() as scope:
        if context:
            for key, value in context.items():
                scope.set_context(key, value)
        sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info", context: dict = None):
    """Capture a message with context"""
    with sentry_sdk.push_scope() as scope:
        if context:
            for key, value in context.items():
                scope.set_context(key, value)
        sentry_sdk.capture_message(message, level=level)
