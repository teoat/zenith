"""
Application Configuration Module

Centralized configuration for middleware, routers, and application settings.
Target: Keep this file under 500 lines total.
"""

import os
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI

from app.constants import API_VERSION
from core.logging import logger

# Router imports - organized by category
CORE_ROUTERS = {
    "health": ("app.routers.health", "router"),
    "system": ("app.routers.system_routes", "router"),
}

STANDARD_ROUTERS = {
    "auth": ("app.routers.auth", "router"),
    "search": ("app.routers.search", "router"),
    "admin": ("app.routers.admin", "router"),
    "users": ("app.routers.users", "router"),
    "analytics": ("app.routers.analytics", "router"),
    "reporting": ("app.routers.reporting", "router"),
    "cases": ("app.routers.cases", "router"),
    "audit": ("app.routers.audit", "router"),
    "cost_optimization": ("app.routers.cost_optimization", "router"),
    "evidence": ("app.routers.evidence", "router"),
    "fraud": ("app.routers.fraud", "router"),
    "compliance": ("app.routers.compliance", "router"),
}

AI_INTELLIGENCE_ROUTERS = {
    "ai": ("app.routers.ai", "router"),
    "advanced_ai": ("app.routers.advanced_ai", "router"),
}

ADDITIONAL_ROUTERS = {
    "multimodal": ("app.routers.multimodal", "router"),
    "logging": ("app.routers.logging", "router"),
    "apm": ("app.routers.apm", "router"),
    "graph": ("app.routers.graph", "router"),
    "realtime_sync": ("app.routers.realtime_sync", "router"),
    "notifications": ("app.routers.notifications", "router"),
    "backup": ("app.routers.backup", "router"),
    "fraud_rules": ("app.routers.fraud_rules", "router"),
    "collaboration": ("app.routers.collaboration", "router"),
    "stats": ("app.routers.stats", "router"),
    "reconciliation": ("app.routers.reconciliation", "router"),
    "onboarding": ("app.routers.onboarding", "router"),
    "metadata": ("app.routers.metadata", "router"),
    "proof": ("app.routers.proof", "router"),
    "forensic_intel": ("app.routers.forensic_intelligence", "router"),
    "entities": ("app.routers.entities", "router"),
    "relationships": ("app.routers.entities", "relationships_router"),
    "csrf": ("app.routers.csrf", "router"),
}

ROADMAP_ROUTERS = {
    "collaboration_roadmap": ("app.routers.collaboration", "router"),
    "time_travel": ("app.routers.time_travel", "router"),
    "ai_voice": ("app.routers.ai_voice", "router"),
}

NEW_ROADMAP_ROUTERS = {
    "xai": ("app.routers.xai", "router"),
    "regulatory_rag": ("app.routers.regulatory_rag", "router"),
    "auth_biometric": ("app.routers.auth_biometric", "router"),
    "auth_social": ("app.routers.auth_social", "router"),
    "self_healing": ("app.routers.self_healing", "router"),
}

OPTIONAL_ROUTERS = {
    "projects": ("app.routers.projects", "router"),
    "alerts": ("app.routers.alerts", "router"),
    "metrics": ("app.routers.metrics", "router"),
    "streaming": ("app.routers.streaming", "router"),
    "websocket": ("app.routers.websocket", "router"),
    "diagnostics": ("app.routers.diagnostics", "router"),
}

# Middleware configuration
MIDDLEWARE_CONFIG = {
    "security": {
        "HTTPSRedirectMiddleware": {
            "condition": lambda: os.getenv("ENVIRONMENT", "development").lower() != "development"
        },
        "TrustedHostMiddleware": {
            "condition": lambda: os.getenv("ENVIRONMENT", "development").lower() != "development",
            "kwargs": {
                "allowed_hosts": [
                    "api.zenith.com",
                    "localhost",
                    "testserver",
                    "testclient",
                ]
            },
        },
        "SecurityHeadersMiddleware": {},
        "CSRFProtectionMiddleware": {},
        "ZeroTrustMiddleware": {},
    },
    "performance": {
        "CORSMiddleware": {
            "kwargs": {
                "allow_origins": lambda: _get_cors_origins(),
                "allow_credentials": True,
                "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": [
                    "Authorization",
                    "Content-Type",
                    "X-Requested-With",
                    "Accept",
                    "Accept-Encoding",
                    "Accept-Language",
                ],
                "max_age": 86400,
            }
        },
        "GZipMiddleware": {"kwargs": {"minimum_size": 1000}},
        "PerformanceMonitoringMiddleware": {},
        "APMMiddleware": {},
    },
    "monitoring": {
        "RequestIDMiddleware": {},
        "DeprecatedEndpointMonitor": {},
        "UnifiedRateLimitingMiddleware": {},
        "InputValidationMiddleware": {},
        "ErrorEnforcementMiddleware": {},
    },
}


def _get_cors_origins() -> List[str]:
    """Get CORS origins based on environment"""
    environment = os.getenv("ENVIRONMENT", "development").lower()
    if environment == "development":
        return [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000",
        ]
    else:
        return ["https://app.zenith.com", "https://api.zenith.com"]


def setup_routers(app: FastAPI):
    """Setup all application routers with proper organization"""

    # Core routers (health, system)
    for name, (module_path, router_attr) in CORE_ROUTERS.items():
        _import_and_include_router(app, module_path, router_attr, name, "")

    # Standard API routers
    for name, (module_path, router_attr) in STANDARD_ROUTERS.items():
        prefix = f"/api/{API_VERSION}/{name}"
        _import_and_include_router(app, module_path, router_attr, name, prefix)

    # AI & Intelligence routers
    for name, (module_path, router_attr) in AI_INTELLIGENCE_ROUTERS.items():
        prefix = f"/api/{API_VERSION}/{name}"
        tags = ["AI Intelligence"] if name == "ai" else ["Advanced AI"]
        _import_and_include_router(app, module_path, router_attr, name, prefix, tags)

    # Additional routers
    for name, (module_path, router_attr) in ADDITIONAL_ROUTERS.items():
        prefix = f"/api/{API_VERSION}/{name}"
        _import_and_include_router(app, module_path, router_attr, name, prefix)

    # Special handling for deprecated semantic search router
    _setup_semantic_search_router(app)

    # Roadmap routers
    for name, (module_path, router_attr) in ROADMAP_ROUTERS.items():
        prefix = (
            f"/api/{API_VERSION}/{name}" if name != "collaboration_roadmap" else f"/api/{API_VERSION}/collaboration"
        )
        tags = ["Roadmap"] if name != "collaboration_roadmap" else ["Collaboration (Roadmap)"]
        _import_and_include_router(app, module_path, router_attr, name, prefix, tags)

    # New roadmap routers (completed)
    for name, (module_path, router_attr) in NEW_ROADMAP_ROUTERS.items():
        _import_and_include_router(app, module_path, router_attr, name, f"/api/{API_VERSION}")

    # Optional routers with graceful error handling
    for name, (module_path, router_attr) in OPTIONAL_ROUTERS.items():
        try:
            if name == "metrics":
                _import_and_include_router(app, module_path, router_attr, name, "")
            elif name in ["streaming", "websocket"]:
                _import_and_include_router(app, module_path, router_attr, name, f"/api/{API_VERSION}")
            else:
                prefix = f"/api/{API_VERSION}/{name}"
                _import_and_include_router(app, module_path, router_attr, name, prefix)
        except ImportError as e:
            logger.warning(f"Failed to import {name} router: {e}")


def _import_and_include_router(
    app: FastAPI, module_path: str, router_attr: str, name: str, prefix: str = "", tags: Optional[List[str]] = None
):
    """Import and include a router with error handling"""
    try:
        module = __import__(module_path, fromlist=[router_attr])
        router = getattr(module, router_attr)
        app.include_router(router, prefix=prefix, tags=tags or [name.title()])
    except ImportError as e:
        logger.error(f"Failed to import router {name} from {module_path}: {e}")


def _setup_semantic_search_router(app: FastAPI):
    """Setup deprecated semantic search router with removal deadline"""
    from app.routers.semantic_search import router as semantic_search_router

    removal_deadline = datetime(2026, 2, 1)
    if datetime.now() < removal_deadline:
        app.include_router(
            semantic_search_router,
            prefix=f"/api/{API_VERSION}/semantic_search",
            tags=["Semantic Search (DEPRECATED)"],
        )
    else:
        logger.warning("Semantic search router removal deadline reached - endpoints disabled")


def setup_middleware(app: FastAPI):
    """Setup all application middleware with proper configuration"""

    # Setup exception handlers and error enforcement first
    import os

    debug_mode = os.getenv("ENVIRONMENT", "development").lower() != "production"

    from core.error_enforcement import setup_error_enforcement_middleware

    setup_error_enforcement_middleware(app, debug=debug_mode)

    # Setup unified rate limiting
    from core.unified_rate_limiting import RateLimitingMiddleware

    app.add_middleware(RateLimitingMiddleware)

    # Apply middleware in order
    for category, middlewares in MIDDLEWARE_CONFIG.items():
        for middleware_name, config in middlewares.items():
            # Skip unified rate limiting and error enforcement as they're already added
            if middleware_name in ["UnifiedRateLimitingMiddleware", "ErrorEnforcementMiddleware"]:
                continue

            # Check condition if present
            if "condition" in config and not config["condition"]():
                continue

            # Import and add middleware
            try:
                middleware_class = _import_middleware(middleware_name)
                kwargs = config.get("kwargs", {})

                # Handle callable kwargs (like CORS origins)
                for key, value in kwargs.items():
                    if callable(value):
                        kwargs[key] = value()

                app.add_middleware(middleware_class, **kwargs)
            except ImportError as e:
                logger.warning(f"Failed to import middleware {middleware_name}: {e}")

    # Add request logging middleware last
    from app.middleware_setup import request_logging_middleware

    app.middleware("http")(request_logging_middleware)


def _import_middleware(middleware_name: str):
    """Import middleware class by name"""
    middleware_map = {
        "HTTPSRedirectMiddleware": "fastapi.middleware.httpsredirect",
        "TrustedHostMiddleware": "fastapi.middleware.trustedhost",
        "CORSMiddleware": "fastapi.middleware.cors",
        "GZipMiddleware": "fastapi.middleware.gzip",
        "SecurityHeadersMiddleware": "app.middleware_setup",
        "CSRFProtectionMiddleware": "core.csrf_protection",
        "ZeroTrustMiddleware": "app.middleware.security",
        "PerformanceMonitoringMiddleware": "core.performance",
        "APMMiddleware": "app.services.infrastructure.apm_service",
        "RequestIDMiddleware": "middleware.request_id",
        "DeprecatedEndpointMonitor": "app.middleware.deprecated_monitor",
        "UnifiedRateLimitingMiddleware": "core.unified_rate_limiting",
        "InputValidationMiddleware": "core.validation",
        "ErrorEnforcementMiddleware": "core.error_enforcement",
    }

    module_path = middleware_map.get(middleware_name)
    if not module_path:
        raise ImportError(f"Unknown middleware: {middleware_name}")

    module = __import__(module_path, fromlist=[middleware_name])
    return getattr(module, middleware_name)


# Application configuration
class AppConfig:
    """Centralized application configuration"""

    ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
    IS_DEVELOPMENT = ENVIRONMENT == "development"

    # Security settings
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": (
            "default-src 'self'; script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; "
            "font-src 'self' data:;"
        ),
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }

    # Rate limiting settings
    RATE_LIMIT_SETTINGS = {
        "default": {"requests": 100, "window": 60},
        "/api/v1/auth/login": {"requests": 5, "window": 300},
        "/api/v1/auth/register": {"requests": 3, "window": 3600},
        "/api/v1/evidence/upload": {"requests": 10, "window": 3600},
    }

    @classmethod
    def get_cors_config(cls) -> Dict:
        """Get CORS configuration"""
        return {
            "allow_origins": _get_cors_origins(),
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Accept-Encoding",
                "Accept-Language",
            ],
            "max_age": 86400,
        }


# Export main setup functions
__all__ = [
    "setup_routers",
    "setup_middleware",
    "AppConfig",
    "MIDDLEWARE_CONFIG",
    "CORE_ROUTERS",
    "STANDARD_ROUTERS",
    "AI_INTELLIGENCE_ROUTERS",
    "ADDITIONAL_ROUTERS",
]
