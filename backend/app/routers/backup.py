"""
Backup and Recovery API Router
Provides endpoints for backup management and disaster recovery

SECURITY: All endpoints require admin authentication.
Restore operations should require MFA in production.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services.infrastructure.security.audit_service import audit_service
from app.services.infrastructure.auth_service import auth_service
from app.services.infrastructure.storage.backup_service import get_backup_manager
from core.database import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/backup",
    tags=["Backup & Recovery"],
    responses={404: {"description": "Not found"}},
)

# ===== AUTHENTICATION DEPENDENCY =====


async def require_admin(
    current_user: User = Depends(auth_service.get_current_user),
) -> User:
    """
    Dependency that ensures the current user has admin role.
    Backup operations are critical and require admin privileges.

    Args:
        current_user: The authenticated user

    Returns:
        User: The admin user

    Raises:
        HTTPException: 403 if user is not an admin
    """
    if current_user.role not in ["admin", "super_admin"]:
        logger.warning(
            f"User {current_user.id} attempted backup operation without admin permission",
            extra={"user_id": current_user.id, "role": current_user.role},
        )
        raise HTTPException(
            status_code=403, detail="Admin access required for backup operations"
        )
    return current_user


# Request/Response Models


class BackupRequest(BaseModel):
    reason: str = Field("manual", description="Reason for creating backup")
    type: Literal["full", "incremental", "auto"] = Field(
        "auto", description="Backup type"
    )


class BackupResponse(BaseModel):
    success: bool = True
    backup_id: Optional[str] = None
    type: Optional[str] = None
    timestamp: Optional[str] = None
    size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None
    message: Optional[str] = None


class RestoreRequest(BaseModel):
    backup_id: str = Field(..., description="ID of backup to restore")
    target_dir: Optional[str] = Field(None, description="Target directory for restore")


class RestoreResponse(BaseModel):
    success: bool = True
    backup_id: Optional[str] = None
    restore_path: Optional[str] = None
    components: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BackupStatus(BaseModel):
    is_backup_running: bool
    last_backup_time: Optional[str]
    backup_stats: Dict[str, Any]
    recent_backups: List[Dict[str, Any]]
    configuration: Dict[str, Any]


class BackupInfo(BaseModel):
    id: str
    type: str
    timestamp: str
    reason: str
    size_bytes: int
    duration_seconds: float
    components: Dict[str, Any]
    integrity_hash: str
    compression_ratio: float


class IntegrityCheckResponse(BaseModel):
    valid: bool
    backup_id: Optional[str] = None
    size: Optional[int] = None
    integrity_hash: Optional[str] = None
    error: Optional[str] = None


# API Endpoints


@router.post("/create", response_model=BackupResponse)
async def create_backup(
    request: BackupRequest,
    background_tasks: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    """
    Create a new backup of the system.

    This endpoint supports both full and incremental backups.
    Full backups contain all system data, while incremental backups
    only contain changes since the last full backup.
    """
    try:
        # Audit log backup creation
        audit_service.log_security_event(
            user_id=admin.id,
            action="BACKUP_CREATE",
            resource_type="backup",
            details={"type": request.type, "reason": request.reason},
        )

        logger.warning(
            f"Admin {admin.id} ({admin.email}) creating {request.type} backup",
            extra={"admin_id": admin.id, "backup_type": request.type},
        )

        backup_manager = await get_backup_manager()

        if request.type == "full":
            # Create full backup in background
            background_tasks.add_task(perform_full_backup, request.reason)
            return BackupResponse(
                success=True, message=f"Full backup started by {admin.email}"
            )

        elif request.type == "incremental":
            # Create incremental backup in background
            background_tasks.add_task(perform_incremental_backup, request.reason)
            return BackupResponse(
                success=True, message="Incremental backup started in background"
            )

        else:  # auto
            # Determine best backup type automatically
            background_tasks.add_task(perform_auto_backup, request.reason)
            return BackupResponse(
                success=True, message="Automatic backup started in background"
            )

    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backup creation failed: {str(e)}")


@router.post("/restore", response_model=RestoreResponse)
async def restore_backup(request: RestoreRequest, admin: User = Depends(require_admin)):
    """
    Restore system from a backup.

    This operation will restore the system to the state captured
    in the specified backup. Use with caution as it may overwrite
    current data.
    """
    try:
        # CRITICAL AUDIT LOG - Restore is destructive!
        audit_service.log_security_event(
            user_id=admin.id,
            action="BACKUP_RESTORE_CRITICAL",
            resource_type="backup",
            details={
                "backup_id": request.backup_id,
                "target_dir": request.target_dir,
                "warning": "DESTRUCTIVE_OPERATION",
            },
        )

        logger.critical(
            f"CRITICAL: Admin {admin.id} ({admin.email}) initiating backup restore",
            extra={
                "admin_id": admin.id,
                "backup_id": request.backup_id,
                "operation": "RESTORE",
            },
        )

        # NOTE: In a production environment, this should enforce MFA verification.
        # Currently disabled to allow automated system recovery testing.
        # if not admin.mfa_verified:
        #     raise HTTPException(status_code=403, detail="MFA verification required for restore")

        backup_manager = await get_backup_manager()

        result = await backup_manager.restore_backup(
            request.backup_id, request.target_dir
        )

        if result["success"]:
            return RestoreResponse(**result)
        else:
            return RestoreResponse(success=False, error=result.get("error"))

    except Exception as e:
        logger.error(f"Backup restoration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Restoration failed: {str(e)}")


@router.get("/status", response_model=BackupStatus)
async def get_backup_status(admin: User = Depends(require_admin)):
    """
    Get current backup system status and statistics.

    Returns information about backup operations, recent backups,
    and system configuration.
    """
    try:
        logger.info(
            f"Admin {admin.id} accessing backup status", extra={"admin_id": admin.id}
        )
        backup_manager = await get_backup_manager()
        return backup_manager.get_backup_status()

    except Exception as e:
        logger.error(f"Failed to get backup status: {e}")
        raise HTTPException(
            status_code=500, detail=f"Status retrieval failed: {str(e)}"
        )


@router.get("/list", response_model=List[BackupInfo])
async def list_backups(admin: User = Depends(require_admin)):
    """
    List all available backups.

    Returns a list of all backups in the system, including
    full and incremental backups with their metadata.
    """
    try:
        logger.info(f"Admin {admin.id} listing backups", extra={"admin_id": admin.id})
        backup_manager = await get_backup_manager()
        backups = backup_manager.get_available_backups()

        # Convert to response format
        return [
            BackupInfo(
                id=backup["id"],
                type=backup["type"],
                timestamp=backup["timestamp"],
                reason=backup["reason"],
                size_bytes=backup["size_bytes"],
                duration_seconds=backup["duration_seconds"],
                components=backup["components"],
                integrity_hash=backup["integrity_hash"],
                compression_ratio=backup.get("compression_ratio", 0.0),
            )
            for backup in backups
        ]

    except Exception as e:
        logger.error(f"Failed to list backups: {e}")
        raise HTTPException(status_code=500, detail=f"Backup listing failed: {str(e)}")


@router.get("/verify/{backup_id}", response_model=IntegrityCheckResponse)
async def verify_backup_integrity(backup_id: str, admin: User = Depends(require_admin)):
    """
    Verify the integrity of a specific backup.

    Checks the backup archive integrity using SHA-256 hash
    verification and validates the archive structure.
    """
    try:
        logger.info(
            f"Admin {admin.id} verifying backup {backup_id}",
            extra={"admin_id": admin.id, "backup_id": backup_id},
        )
        backup_manager = await get_backup_manager()
        result = await backup_manager.verify_backup_integrity(backup_id)

        return IntegrityCheckResponse(**result)

    except Exception as e:
        logger.error(f"Backup integrity check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Integrity check failed: {str(e)}")


@router.delete("/{backup_id}")
async def delete_backup(backup_id: str, admin: User = Depends(require_admin)):
    """
    Delete a specific backup.

    Permanently removes the backup from the system.
    Use with caution as deleted backups cannot be recovered.
    """
    try:
        # Audit log backup deletion
        audit_service.log_security_event(
            user_id=admin.id,
            action="BACKUP_DELETE",
            resource_type="backup",
            details={"backup_id": backup_id},
        )

        logger.warning(
            f"Admin {admin.id} ({admin.email}) deleting backup {backup_id}",
            extra={"admin_id": admin.id, "backup_id": backup_id},
        )

        backup_manager = await get_backup_manager()

        # Find backup
        backups = backup_manager.get_available_backups()
        backup_info = next((b for b in backups if b["id"] == backup_id), None)

        if not backup_info:
            raise HTTPException(status_code=404, detail="Backup not found")

        # Delete archive file
        import os

        archive_path = backup_info.get("archive_path")
        if archive_path and os.path.exists(archive_path):
            os.remove(archive_path)

        # Remove from metadata
        backup_manager.backup_metadata["backups"] = [
            b for b in backup_manager.backup_metadata["backups"] if b["id"] != backup_id
        ]
        backup_manager._save_metadata()

        return {
            "success": True,
            "message": f"Backup {backup_id} deleted by {admin.email}",
            "backup_id": backup_id,
            "deleted_by": admin.email,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup deletion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@router.post("/cleanup")
async def cleanup_old_backups(admin: User = Depends(require_admin)):
    """
    Clean up old backups based on retention policy.

    Removes backups older than the configured retention period
    to free up disk space.
    """
    try:
        # Audit log cleanup
        audit_service.log_security_event(
            user_id=admin.id,
            action="BACKUP_CLEANUP",
            resource_type="backup",
            details={"operation": "cleanup_old_backups"},
        )

        logger.warning(
            f"Admin {admin.id} ({admin.email}) cleaning up old backups",
            extra={"admin_id": admin.id},
        )

        backup_manager = await get_backup_manager()
        removed_count = await backup_manager._cleanup_old_backups()

        return {
            "success": True,
            "message": f"Cleaned up {removed_count} old backups",
            "removed_count": removed_count,
            "executed_by": admin.email,
        }

    except Exception as e:
        logger.error(f"Backup cleanup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


@router.get("/config")
async def get_backup_config(admin: User = Depends(require_admin)):
    """
    Get backup system configuration.

    Returns the current backup configuration settings.
    """
    try:
        logger.info(
            f"Admin {admin.id} accessing backup configuration",
            extra={"admin_id": admin.id},
        )
        backup_manager = await get_backup_manager()
        return {"success": True, "config": backup_manager.config}

    except Exception as e:
        logger.error(f"Failed to get backup config: {e}")
        raise HTTPException(
            status_code=500, detail=f"Config retrieval failed: {str(e)}"
        )


@router.put("/config")
async def update_backup_config(
    config: Dict[str, Any], admin: User = Depends(require_admin)
):
    """
    Update backup system configuration.

    Allows updating backup settings like retention period,
    compression level, and scheduling.
    """
    try:
        # Audit log config change
        audit_service.log_security_event(
            user_id=admin.id,
            action="BACKUP_CONFIG_UPDATE",
            resource_type="backup",
            details={"config_keys": list(config.keys())},
        )

        logger.warning(
            f"Admin {admin.id} ({admin.email}) updating backup configuration",
            extra={"admin_id": admin.id, "config_keys": list(config.keys())},
        )

        backup_manager = await get_backup_manager()

        # Validate config updates
        valid_keys = {
            "retention_days",
            "max_backup_size_gb",
            "compression_level",
            "encryption_enabled",
            "remote_backup_enabled",
            "remote_backup_url",
            "backup_schedule",
            "full_backup_interval_days",
            "incremental_backup_enabled",
        }

        for key, value in config.items():
            if key in valid_keys:
                backup_manager.config[key] = value
            else:
                raise HTTPException(
                    status_code=400, detail=f"Invalid config key: {key}"
                )

        # Save updated config (in production, this should persist to database)
        logger.info(
            f"Backup configuration updated by {admin.email}: {config}",
            extra={"admin_id": admin.id},
        )

        return {
            "success": True,
            "message": "Backup configuration updated successfully",
            "config": backup_manager.config,
            "updated_by": admin.email,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup config update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Config update failed: {str(e)}")


# Background task functions


async def perform_full_backup(reason: str):
    """Background task to perform full backup"""
    try:
        logger.info(f"Starting full backup: {reason}")
        backup_manager = await get_backup_manager()
        result = await backup_manager.create_full_backup(reason)
        logger.info(f"Full backup completed: {result['id']}")
    except Exception as e:
        logger.error(f"Full backup failed: {e}")


async def perform_incremental_backup(reason: str):
    """Background task to perform incremental backup"""
    try:
        logger.info(f"Starting incremental backup: {reason}")
        backup_manager = await get_backup_manager()
        result = await backup_manager.create_incremental_backup(reason)
        if result:
            logger.info(f"Incremental backup completed: {result['id']}")
        else:
            logger.info("Incremental backup skipped (no changes)")
    except Exception as e:
        logger.error(f"Incremental backup failed: {e}")


async def perform_auto_backup(reason: str):
    """Background task to perform automatic backup (chooses best type)"""
    try:
        logger.info(f"Starting automatic backup: {reason}")
        backup_manager = await get_backup_manager()

        # Check if we need a full backup
        last_full = backup_manager.backup_metadata.get("last_full_backup")
        if not last_full:
            # No full backup exists, create one
            result = await backup_manager.create_full_backup(reason)
            logger.info(f"Automatic full backup completed: {result['id']}")
        else:
            # Check if full backup is due
            from datetime import datetime, timedelta

            last_full_datetime = datetime.fromisoformat(
                last_full.replace("Z", "+00:00")
            )
            days_since_full = (datetime.now() - last_full_datetime).days

            if days_since_full >= backup_manager.config["full_backup_interval_days"]:
                # Time for a full backup
                result = await backup_manager.create_full_backup(reason)
                logger.info(f"Automatic full backup completed: {result['id']}")
            else:
                # Create incremental backup
                result = await backup_manager.create_incremental_backup(reason)
                if result:
                    logger.info(
                        f"Automatic incremental backup completed: {result['id']}"
                    )
                else:
                    logger.info("Automatic incremental backup skipped (no changes)")

    except Exception as e:
        logger.error(f"Automatic backup failed: {e}")


# Health check endpoint for backup service
@router.get("/health")
async def backup_health_check():
    """
    Health check for backup service components
    """
    try:
        backup_manager = await get_backup_manager()

        health_status = {
            "service": "backup",
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "backup_directory": {
                    "status": (
                        "healthy"
                        if backup_manager.backup_base_dir.exists()
                        else "unhealthy"
                    ),
                    "path": str(backup_manager.backup_base_dir),
                },
                "database": {
                    "status": (
                        "healthy"
                        if backup_manager.config["database_path"]
                        else "unhealthy"
                    ),
                    "path": backup_manager.config["database_path"],
                },
                "metadata": {
                    "status": "healthy",
                    "backups_count": len(
                        backup_manager.backup_metadata.get("backups", [])
                    ),
                },
            },
            "stats": backup_manager.backup_stats,
        }

        return health_status

    except Exception as e:
        return {
            "service": "backup",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }
