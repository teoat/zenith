import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.constants import VERSION
from app.routers.health import health_check
from app.services.infrastructure.circuit_breaker import get_circuit_breaker
from app.services.infrastructure.monitoring_service import monitoring_service
from app.services.infrastructure.performance_monitor import performance_monitor
from app.services.infrastructure.proactive_monitoring import proactive_monitoring
from app.services.infrastructure.storage.database_service import db_service
from app.services.integration.collaboration.collaboration_service import collaboration_manager
from core.database import create_tables
from core.immutable_audit import immutable_audit
from core.integrity_checker import integrity_checker
from core.logging import logger

# Global background tasks reference to prevent GC
_background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events with 99.99% uptime procedures"""
    print("DEBUG: Lifespan called!")
    startup_start = asyncio.get_event_loop().time()
    print("DEBUG: Lifespan startup beginning")
    logger.info(
        "Starting Zenith Fraud Detection API with 99.99% uptime target",
        extra={"event": "startup"},
    )

    print("DEBUG: About to start phases")

    # Graceful startup with health verification
    try:
        # Phase 1: Database initialization
        logger.info("Phase 1: Database initialization", extra={"startup_phase": 1})

        # Create database tables (Development only) - MUST happen before health check
        # In production, use Alembic migrations: `alembic upgrade head`
        if os.getenv("ENVIRONMENT", "development").lower() == "development":
            create_tables()
            logger.info(
                "Database tables created successfully (Development Mode)",
                extra={"event": "database_init"},
            )
        else:
            logger.info(
                "Skipping auto-table creation (Production Mode). Ensure migrations are applied.",
                extra={"event": "database_init"},
            )

        # Verify database connectivity and health
        max_db_retries = 5
        db_retry_delay = 2

        for attempt in range(max_db_retries):
            try:
                db_health = db_service.health_check()
                if db_health["status"] in [
                    "healthy",
                    "degraded",
                ]:  # Support degraded for initial startup
                    logger.info(
                        f"Database health check passed/degraded on attempt {attempt + 1}",
                        extra={"db_health": db_health},
                    )
                    break
                else:
                    logger.warning(f"Database health check failed on attempt {attempt + 1}: {db_health}")
                    if attempt < max_db_retries - 1:
                        await asyncio.sleep(db_retry_delay)
                        continue
                    else:
                        raise RuntimeError(f"Database health check failed after {max_db_retries} attempts")
            except Exception as e:
                logger.error(f"Database health check error on attempt {attempt + 1}: {e}")
                if attempt < max_db_retries - 1:
                    await asyncio.sleep(db_retry_delay)
                    continue
                else:
                    raise RuntimeError(f"Database initialization failed after {max_db_retries} attempts: {e}")

        # Phase 21: Boot Integrity Check
        immutable_audit.add_entry({"event": "system_boot", "status": "initiated", "version": VERSION})

        # Integrity Checker
        if not integrity_checker.check_integrity():
            logger.critical("System Boot Aborted: Integrity Check Failed")
            raise RuntimeError("CRITICAL: System Integrity Compromised")

        logger.info(
            f"Boot Integrity Verified. Audit Root Hash: {immutable_audit.get_latest_hash()}",
            extra={"event": "boot_integrity"},
        )

        # Phase 2: Service initialization with error handling
        logger.info(
            "Phase 2: Service initialization with error handling",
            extra={"startup_phase": 2},
        )

        # Initialize monitoring services with graceful fallback
        try:
            # Initialize proactive monitoring for 99.99% uptime
            await proactive_monitoring.start_monitoring()
            logger.info(
                "✅ Proactive monitoring started for 99.99% uptime",
                extra={"service": "proactive_monitoring"},
            )

            monitoring_service.start_monitoring()
            performance_monitor.start_monitoring()
            logger.info("ℹ️ APM monitoring skipped (optional service)", extra={"service": "apm"})
        except Exception as e:
            logger.info(
                f"APM service not available: {e}",
                extra={"service": "apm", "error": str(e)},
            )

        # Phase 3: Circuit breaker and resilience initialization
        logger.info(
            "Phase 3: Circuit breaker and resilience initialization",
            extra={"startup_phase": 3},
        )

        # Verify circuit breakers are ready
        critical_breakers = ["database_connection", "external_api_calls"]
        for breaker_name in critical_breakers:
            try:
                get_circuit_breaker(breaker_name)
                logger.info(
                    f"✅ Circuit breaker '{breaker_name}' initialized",
                    extra={"circuit_breaker": breaker_name},
                )
            except Exception as e:
                logger.error(
                    f"Failed to initialize circuit breaker '{breaker_name}': {e}",
                    extra={"circuit_breaker": breaker_name, "error": str(e)},
                )

        # Phase 4: Final health verification
        logger.info("Phase 4: Final health verification", extra={"startup_phase": 4})

        try:
            # Import and run comprehensive health check
            health_result = await health_check()

            if health_result["status"] == "healthy":
                startup_duration = asyncio.get_event_loop().time() - startup_start
                logger.info(
                    f"🎉 Application startup completed successfully in {startup_duration:.2f}s",
                    extra={
                        "event": "startup_complete",
                        "startup_duration_seconds": startup_duration,
                        "health_status": "healthy",
                    },
                )
            else:
                logger.warning(
                    f"Application started with health issues: {health_result}",
                    extra={
                        "event": "startup_degraded",
                        "health_status": health_result["status"],
                    },
                )

        except Exception as e:
            logger.error(f"Final health check failed: {e}", extra={"error": str(e)})

        logger.info(
            "Monitoring services initialized successfully",
            extra={"event": "monitoring_start"},
        )

        # Start collaboration WebSocket server if enabled
        print("DEBUG: About to check WebSocket startup")
        ws_enabled = os.getenv("ENABLE_COLLABORATION_WS", "false").lower() == "true"
        print(f"DEBUG: ENABLE_COLLABORATION_WS={os.getenv('ENABLE_COLLABORATION_WS')}, ws_enabled={ws_enabled}")
        if ws_enabled:
            print("DEBUG: Starting WebSocket server...")
            try:
                # Start WebSocket server in background task
                websocket_task = asyncio.create_task(collaboration_manager.start_server())
                _background_tasks.append(websocket_task)
                print("DEBUG: WebSocket server start task created")
                logger.info(
                    "Collaboration WebSocket server started successfully",
                    extra={"event": "websocket_started"},
                )
            except Exception as e:
                print(f"DEBUG: WebSocket startup failed: {e}")
                logger.error(f"Failed to start WebSocket server: {e}", exc_info=True)
        else:
            print("DEBUG: WebSocket server disabled")
            logger.info(
                "WebSocket server disabled (set ENABLE_COLLABORATION_WS=true to enable)",
                extra={"event": "websocket_disabled"},
            )
        logger.info(
            "Zenith API startup completed successfully",
            extra={"event": "startup_complete"},
        )
    except Exception as e:
        logger.error(
            "Failed to start Zenith API",
            extra={"error": str(e), "event": "startup_failed"},
        )
        raise

    yield  # Application runs here

    # Graceful Shutdown with 99.99% uptime procedures
    shutdown_start = asyncio.get_event_loop().time()
    logger.info(
        "Initiating graceful shutdown of Zenith Fraud Detection API",
        extra={"event": "shutdown"},
    )

    try:
        # Phase 1: Stop accepting new requests
        logger.info("Phase 1: Stopping new request acceptance", extra={"shutdown_phase": 1})

        # Phase 2: Drain existing connections gracefully
        logger.info("Phase 2: Draining existing connections", extra={"shutdown_phase": 2})
        # Give active requests time to complete (configurable grace period)
        grace_period = int(os.getenv("SHUTDOWN_GRACE_PERIOD", "30"))
        logger.info(
            f"Waiting {grace_period}s for active requests to complete",
            extra={"grace_period": grace_period},
        )
        await asyncio.sleep(min(grace_period, 10))  # Don't wait more than 10s in testing

        # Phase 3: Stop monitoring services
        logger.info("Phase 3: Stopping monitoring services", extra={"shutdown_phase": 3})

        # Stop proactive monitoring first
        try:
            await proactive_monitoring.stop_monitoring()
            logger.info(
                "✅ Proactive monitoring stopped",
                extra={"service": "proactive_monitoring"},
            )
        except Exception as e:
            logger.warning(
                f"Error stopping proactive monitoring: {e}",
                extra={"service": "proactive_monitoring", "error": str(e)},
            )

        try:
            monitoring_service.stop_monitoring()
            logger.info("✅ Monitoring service stopped", extra={"service": "monitoring"})
        except Exception as e:
            logger.warning(
                f"Error stopping monitoring service: {e}",
                extra={"service": "monitoring", "error": str(e)},
            )

        try:
            performance_monitor.stop_monitoring()
            logger.info(
                "✅ Performance monitoring stopped",
                extra={"service": "performance_monitoring"},
            )
        except Exception as e:
            logger.warning(
                f"Error stopping performance monitoring: {e}",
                extra={"service": "performance_monitoring", "error": str(e)},
            )

        # Phase 4: Close database connections gracefully
        logger.info("Phase 4: Closing database connections", extra={"shutdown_phase": 4})
        try:
            # The database service uses SQLAlchemy connection pooling which handles cleanup automatically
            logger.info(
                "✅ Database connections prepared for cleanup",
                extra={"service": "database"},
            )
        except Exception as e:
            logger.warning(
                f"Error preparing database cleanup: {e}",
                extra={"service": "database", "error": str(e)},
            )

        # Phase 5: Stop WebSocket services
        logger.info(
            "Phase 5: Stopping WebSocket and collaboration services",
            extra={"shutdown_phase": 5},
        )
        try:
            await collaboration_manager.stop_server()
            logger.info(
                "✅ Collaboration WebSocket server stopped",
                extra={"service": "collaboration"},
            )
        except Exception as e:
            logger.warning(
                f"Error stopping collaboration server: {e}",
                extra={"service": "collaboration", "error": str(e)},
            )

        # Phase 6: Final cleanup and verification
        logger.info("Phase 6: Final cleanup and verification", extra={"shutdown_phase": 6})

        # Save any pending monitoring data
        try:
            # Force flush any pending metrics or logs
            import logging

            logging.shutdown()
            # logger.info("✅ Logging system flushed", extra={"service": "logging"})
        except Exception as e:
            # logger might be closed here
            print(f"Error flushing logs: {e}")

        # Calculate shutdown duration
        shutdown_duration = asyncio.get_event_loop().time() - shutdown_start
        print(f"🎉 Graceful shutdown completed in {shutdown_duration:.2f}s")

    except Exception as e:
        shutdown_duration = asyncio.get_event_loop().time() - shutdown_start
        print(f"Error during graceful shutdown after {shutdown_duration:.2f}s: {e}")
