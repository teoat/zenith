"""
Deprecated Endpoint Monitoring

This module provides monitoring and alerting for deprecated API endpoints.
Tracks usage patterns and sends alerts when deprecated endpoints are accessed.
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Track deprecated endpoint usage
_deprecated_usage_stats = defaultdict(
    lambda: {
        "count": 0,
        "first_seen": None,
        "last_seen": None,
        "user_agents": set(),
        "ip_addresses": set(),
    }
)

# Define deprecated endpoints
DEPRECATED_ENDPOINTS = {
    "/api/v1/semantic_search/index": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": "/api/v1/ai/embeddings",
        "method": "POST",
    },
    "/api/v1/semantic_search/index/batch": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": "/api/v1/ai/embeddings",
        "method": "POST",
    },
    "/api/v1/semantic_search/search": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": "/api/v1/ai/semantic-search",
        "method": "POST",
    },
    "/api/v1/semantic_search/stats": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": None,
        "method": "GET",
    },
    "/api/v1/semantic_search/rebuild": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": None,
        "method": "POST",
    },
    "/api/v1/semantic_search/backends": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": None,
        "method": "GET",
    },
    "/api/v1/semantic_search/switch-backend": {
        "deprecated_since": "2025-12-20",
        "removal_date": "2026-02-01",
        "replacement": None,
        "method": "POST",
    },
}

# Alert thresholds
ALERT_THRESHOLD_HOURLY = 10  # Alert if deprecated endpoint called 10+ times per hour
ALERT_THRESHOLD_DAILY = 100  # Alert if deprecated endpoint called 100+ times per day


class DeprecatedEndpointMonitor(BaseHTTPMiddleware):
    """Middleware to monitor and alert on deprecated endpoint usage"""

    async def dispatch(self, request: Request, call_next):
        """Track deprecated endpoint calls"""
        path = request.url.path
        method = request.method

        # Check if this is a deprecated endpoint
        if path in DEPRECATED_ENDPOINTS:
            endpoint_info = DEPRECATED_ENDPOINTS[path]

            # Only track if method matches
            if endpoint_info["method"] == method:
                await self._track_usage(request, path, endpoint_info)

        # Continue with request
        response = await call_next(request)
        return response

    async def _track_usage(self, request: Request, path: str, endpoint_info: dict):
        """Track usage statistics for deprecated endpoint"""
        now = datetime.utcnow()
        user_agent = request.headers.get("user-agent", "unknown")
        ip_address = request.client.host if request.client else "unknown"

        # Update stats
        stats = _deprecated_usage_stats[path]
        stats["count"] += 1

        if stats["first_seen"] is None:
            stats["first_seen"] = now
        stats["last_seen"] = now

        stats["user_agents"].add(user_agent[:100])  # Truncate to avoid memory issues
        stats["ip_addresses"].add(ip_address)

        # Log the usage
        logger.warning(
            f"Deprecated endpoint accessed: {path}",
            extra={
                "deprecated_endpoint": path,
                "replacement": endpoint_info["replacement"],
                "removal_date": endpoint_info["removal_date"],
                "ip_address": ip_address,
                "user_agent": user_agent,
                "total_calls": stats["count"],
                "unique_ips": len(stats["ip_addresses"]),
                "unique_user_agents": len(stats["user_agents"]),
            },
        )

        # Check if we need to send an alert
        await self._check_alert_threshold(path, stats, endpoint_info)

    async def _check_alert_threshold(self, path: str, stats: dict, endpoint_info: dict):
        """Check if usage has exceeded alert thresholds"""
        now = datetime.utcnow()

        # Check hourly threshold
        if stats["last_seen"] and now - stats["last_seen"] < timedelta(hours=1):
            if stats["count"] >= ALERT_THRESHOLD_HOURLY:
                logger.critical(
                    f"ALERT: Deprecated endpoint {path} called {stats['count']} times in the last hour!",
                    extra={
                        "alert_type": "deprecated_endpoint_high_usage",
                        "endpoint": path,
                        "count": stats["count"],
                        "threshold": ALERT_THRESHOLD_HOURLY,
                        "replacement": endpoint_info["replacement"],
                        "removal_date": endpoint_info["removal_date"],
                        "unique_ips": len(stats["ip_addresses"]),
                        "action_required": "Contact clients to migrate",
                    },
                )

        # Check daily threshold
        if stats["first_seen"] and now - stats["first_seen"] < timedelta(days=1):
            if stats["count"] >= ALERT_THRESHOLD_DAILY:
                logger.critical(
                    f"ALERT: Deprecated endpoint {path} called {stats['count']} times in the last 24 hours!",
                    extra={
                        "alert_type": "deprecated_endpoint_very_high_usage",
                        "endpoint": path,
                        "count": stats["count"],
                        "threshold": ALERT_THRESHOLD_DAILY,
                        "replacement": endpoint_info["replacement"],
                        "removal_date": endpoint_info["removal_date"],
                        "unique_ips": len(stats["ip_addresses"]),
                        "action_required": "URGENT: Mass migration needed",
                    },
                )


def get_deprecated_usage_stats() -> dict[str, dict]:
    """Get statistics on deprecated endpoint usage"""
    # Convert sets to lists for JSON serialization
    stats = {}
    for endpoint, data in _deprecated_usage_stats.items():
        stats[endpoint] = {
            "count": data["count"],
            "first_seen": data["first_seen"].isoformat()
            if data["first_seen"]
            else None,
            "last_seen": data["last_seen"].isoformat() if data["last_seen"] else None,
            "unique_user_agents": len(data["user_agents"]),
            "unique_ip_addresses": len(data["ip_addresses"]),
            "endpoint_info": DEPRECATED_ENDPOINTS.get(endpoint, {}),
        }
    return stats


def get_deprecation_warnings() -> list[dict]:
    """Get list of deprecation warnings for upcoming removals"""
    warnings = []
    now = datetime.utcnow()

    for endpoint, info in DEPRECATED_ENDPOINTS.items():
        removal_date = datetime.fromisoformat(info["removal_date"])
        days_until_removal = (removal_date - now).days

        stats = _deprecated_usage_stats.get(endpoint, {})
        usage_count = stats.get("count", 0)

        if usage_count > 0 and days_until_removal <= 30:
            warnings.append(
                {
                    "endpoint": endpoint,
                    "method": info["method"],
                    "removal_date": info["removal_date"],
                    "days_until_removal": days_until_removal,
                    "usage_count": usage_count,
                    "replacement": info["replacement"],
                    "severity": "critical" if days_until_removal <= 7 else "high",
                }
            )

    return sorted(warnings, key=lambda x: x["days_until_removal"])


def reset_usage_stats():
    """Reset usage statistics (for testing or new reporting period)"""
    global _deprecated_usage_stats
    _deprecated_usage_stats = defaultdict(
        lambda: {
            "count": 0,
            "first_seen": None,
            "last_seen": None,
            "user_agents": set(),
            "ip_addresses": set(),
        }
    )


# Utility function for manual alerts
def check_and_send_deprecation_alerts():
    """Check all deprecated endpoints and send alerts if needed"""
    warnings = get_deprecation_warnings()

    for warning in warnings:
        if warning["severity"] == "critical":
            logger.critical(
                f"CRITICAL: Deprecated endpoint {warning['endpoint']} will be removed in {warning['days_until_removal']} days! "
                f"Still receiving {warning['usage_count']} calls. Migration required!",
                extra=warning,
            )
        elif warning["severity"] == "high":
            logger.error(
                f"WARNING: Deprecated endpoint {warning['endpoint']} will be removed in {warning['days_until_removal']} days. "
                f"Currently receiving {warning['usage_count']} calls.",
                extra=warning,
            )
