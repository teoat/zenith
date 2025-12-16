from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.services.database_service import db_service
from app.services.cache_service import get_cache_stats, clear_cache_namespace, clear_all_cache
from app.services.auth_service import auth_service
from app.services.audit_service import audit_service
from core.database import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if 'get_current_user' not in globals():
    try:
        get_current_user = auth_service.get_current_user
    except Exception:
        def get_current_user(*args, **kwargs):
            return None

if 'require_permission' not in globals():
    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None
        return _dep

for _svc in ('db_service', 'cache_service', 'audit_service'):
    if _svc not in globals():
        globals()[_svc] = None

# ===== AUTHENTICATION DEPENDENCY =====

async def require_admin(
    current_user: User = Depends(auth_service.get_current_user)
) -> User:
    """
    Dependency that ensures the current user has admin role.
    
    Args:
        current_user: The authenticated user
        
    Returns:
        User: The admin user
        
    Raises:
        HTTPException: 403 if user is not an admin
    """
    if current_user.role not in ["admin", "super_admin"]:
        logger.warning(
            f"User {current_user.id} attempted admin operation without permission",
            extra={"user_id": current_user.id, "role": current_user.role}
        )
        raise HTTPException(
            status_code=403, 
            detail="Admin access required"
        )
    return current_user


# ===== DATABASE PERFORMANCE ENDPOINTS =====

@router.get("/database/performance")
async def get_database_performance(admin: User = Depends(require_admin)):
    """Get database performance metrics (Admin only)"""
    try:
        logger.info(
            f"Admin {admin.id} accessing database performance metrics",
            extra={"admin_id": admin.id}
        )
        metrics = db_service.get_database_performance_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Failed to get database performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/database/stats")
async def get_database_stats(admin: User = Depends(require_admin)):
    """Get comprehensive database statistics (Admin only)"""
    try:
        logger.info(
            f"Admin {admin.id} accessing database statistics",
            extra={"admin_id": admin.id}
        )
        stats = db_service.get_database_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get database stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/database/optimize")
async def optimize_database(admin: User = Depends(require_admin)):
    """Trigger database optimization (Admin only)"""
    try:
        # Audit log critical operation
        audit_service.log_security_event(
            user_id=admin.id,
            action="DATABASE_OPTIMIZE",
            resource_type="database",
            details={"operation": "create_indexes"}
        )
        
        logger.warning(
            f"Admin {admin.id} triggering database optimization",
            extra={"admin_id": admin.id, "operation": "optimize"}
        )
        
        db_service.create_performance_indexes()
        
        return {
            "message": "Database optimization completed",
            "executed_by": admin.email
        }
    except Exception as e:
        logger.error(f"Database optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/database/analyze-query")
async def analyze_query(
    query: str, 
    params: dict = None,
    admin: User = Depends(require_admin)
):
    """Analyze query performance with EXPLAIN (Admin only)"""
    try:
        # Audit log - potentially sensitive query analysis
        audit_service.log_security_event(
            user_id=admin.id,
            action="DATABASE_ANALYZE_QUERY",
            resource_type="database",
            details={"query_length": len(query), "has_params": params is not None}
        )
        
        logger.info(
            f"Admin {admin.id} analyzing query",
            extra={"admin_id": admin.id, "query_length": len(query)}
        )
        
        analysis = db_service.analyze_query_performance(query, params)
        return analysis
    except Exception as e:
        logger.error(f"Query analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== CACHE MANAGEMENT ENDPOINTS =====

@router.get("/cache/stats")
async def get_cache_statistics(admin: User = Depends(require_admin)):
    """Get comprehensive cache statistics (Admin only)"""
    try:
        logger.info(
            f"Admin {admin.id} accessing cache statistics",
            extra={"admin_id": admin.id}
        )
        stats = get_cache_stats()
        return {
            "cache_stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cache/namespace/{namespace}")
async def clear_cache_by_namespace(
    namespace: str,
    admin: User = Depends(require_admin)
):
    """Clear all cache entries in a specific namespace (Admin only)"""
    try:
        # Audit log cache clearing
        audit_service.log_security_event(
            user_id=admin.id,
            action="CACHE_CLEAR_NAMESPACE",
            resource_type="cache",
            details={"namespace": namespace}
        )
        
        logger.warning(
            f"Admin {admin.id} clearing cache namespace: {namespace}",
            extra={"admin_id": admin.id, "namespace": namespace}
        )
        
        cleared_count = clear_cache_namespace(namespace)
        
        return {
            "message": f"Cleared {cleared_count} cache entries in namespace '{namespace}'",
            "cleared_count": cleared_count,
            "namespace": namespace,
            "executed_by": admin.email
        }
    except Exception as e:
        logger.error(f"Cache namespace clearing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cache/all")
async def clear_entire_cache(admin: User = Depends(require_admin)):
    """Clear all cache entries - DESTRUCTIVE operation (Admin only)"""
    try:
        # Audit log critical operation
        audit_service.log_security_event(
            user_id=admin.id,
            action="CACHE_CLEAR_ALL",
            resource_type="cache",
            details={"operation": "clear_all_cache"}
        )
        
        logger.warning(
            f"Admin {admin.id} clearing ENTIRE cache - destructive operation",
            extra={"admin_id": admin.id, "operation": "clear_all"}
        )
        
        cleared_count = clear_all_cache()
        
        return {
            "message": f"Cleared {cleared_count} total cache entries",
            "cleared_count": cleared_count,
            "executed_by": admin.email,
            "warning": "All cache has been cleared"
        }
    except Exception as e:
        logger.error(f"Cache clearing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))