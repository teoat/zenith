"""
Feature Flag Management System
Enables gradual rollout of features with granular control
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class FlagType(Enum):
    """Types of feature flags"""

    BOOLEAN = "boolean"
    PERCENTAGE = "percentage"
    ALLOWLIST = "allowlist"
    BLOCKLIST = "blocklist"


class FlagStatus(Enum):
    """Feature flag status"""

    ENABLED = "enabled"
    DISABLED = "disabled"
    ROLLING_OUT = "rolling_out"
    ROLLING_BACK = "rolling_back"


@dataclass
class FeatureFlag:
    """Feature flag configuration"""

    key: str
    name: str
    description: str
    flag_type: str
    status: str
    value: Any
    created_at: str
    updated_at: str
    created_by: str
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    rollout_percentage: Optional[int] = None
    allowlist: Set[str] = field(default_factory=set)
    blocklist: Set[str] = field(default_factory=set)
    expires_at: Optional[str] = None


class FeatureFlagManager:
    """Feature flag management system"""

    def __init__(self, config_path: Path = Path("config/feature_flags.json")):
        self.config_path = config_path
        self.config_path.parent.mkdir(parents=True, exist_ok=True)

        self.flags: Dict[str, FeatureFlag] = {}
        self.audit_log: List[Dict[str, Any]] = []
        self.load_flags()

    def load_flags(self):
        """Load feature flags from configuration"""
        if not self.config_path.exists():
            self._initialize_default_flags()
            return

        try:
            with open(self.config_path, "r") as f:
                data = json.load(f)

            for key, flag_data in data.get("flags", {}).items():
                flag = FeatureFlag(
                    key=key,
                    name=flag_data["name"],
                    description=flag_data["description"],
                    flag_type=flag_data["flag_type"],
                    status=flag_data["status"],
                    value=flag_data["value"],
                    created_at=flag_data["created_at"],
                    updated_at=flag_data["updated_at"],
                    created_by=flag_data.get("created_by", "system"),
                    tags=flag_data.get("tags", []),
                    metadata=flag_data.get("metadata", {}),
                    rollout_percentage=flag_data.get("rollout_percentage"),
                    allowlist=set(flag_data.get("allowlist", [])),
                    blocklist=set(flag_data.get("blocklist", [])),
                    expires_at=flag_data.get("expires_at"),
                )
                self.flags[key] = flag

            logger.info(f"Loaded {len(self.flags)} feature flags")

        except Exception as e:
            logger.error(f"Error loading feature flags: {e}")
            self._initialize_default_flags()

    def _initialize_default_flags(self):
        """Initialize with default feature flags"""
        default_flags = {
            "new_dashboard_ui": FeatureFlag(
                key="new_dashboard_ui",
                name="New Dashboard UI",
                description="Enable redesigned dashboard interface",
                flag_type=FlagType.BOOLEAN.value,
                status=FlagStatus.DISABLED.value,
                value=False,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                created_by="system",
                tags=["ui", "dashboard"],
            ),
            "advanced_ai_analysis": FeatureFlag(
                key="advanced_ai_analysis",
                name="Advanced AI Analysis",
                description="Enable advanced AI-powered analysis features",
                flag_type=FlagType.PERCENTAGE.value,
                status=FlagStatus.ROLLING_OUT.value,
                value=True,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                created_by="system",
                tags=["ai", "analysis"],
                rollout_percentage=20,
            ),
            "simplified_workflow": FeatureFlag(
                key="simplified_workflow",
                name="Simplified Workflow",
                description="Simplified investigation workflow for new users",
                flag_type=FlagType.BOOLEAN.value,
                status=FlagStatus.ENABLED.value,
                value=True,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                created_by="system",
                tags=["workflow", "ux"],
            ),
            "beta_reporting": FeatureFlag(
                key="beta_reporting",
                name="Beta Reporting",
                description="Enable new reporting features in beta",
                flag_type=FlagType.ALLOWLIST.value,
                status=FlagStatus.ROLLING_OUT.value,
                value=True,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat(),
                created_by="system",
                tags=["reporting", "beta"],
                allowlist={"admin@company.com", "beta-testers@company.com"},
            ),
        }

        self.flags = default_flags
        self.save_flags()

    def save_flags(self):
        """Save feature flags to configuration"""
        data = {
            "version": "1.0",
            "last_updated": datetime.now().isoformat(),
            "flags": {},
        }

        for key, flag in self.flags.items():
            data["flags"][key] = {
                "name": flag.name,
                "description": flag.description,
                "flag_type": flag.flag_type,
                "status": flag.status,
                "value": flag.value,
                "created_at": flag.created_at,
                "updated_at": flag.updated_at,
                "created_by": flag.created_by,
                "tags": flag.tags,
                "metadata": flag.metadata,
                "rollout_percentage": flag.rollout_percentage,
                "allowlist": list(flag.allowlist),
                "blocklist": list(flag.blocklist),
                "expires_at": flag.expires_at,
            }

        with open(self.config_path, "w") as f:
            json.dump(data, f, indent=2)

        logger.info(f"Saved {len(self.flags)} feature flags")

    def is_enabled(self, key: str, user_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if feature flag is enabled for given user/context"""
        if key not in self.flags:
            logger.warning(f"Unknown feature flag: {key}")
            return False

        flag = self.flags[key]

        if flag.status == FlagStatus.DISABLED.value:
            return False

        if flag.expires_at:
            expires = datetime.fromisoformat(flag.expires_at)
            if datetime.now() > expires:
                logger.warning(f"Feature flag {key} has expired")
                return False

        if flag.flag_type == FlagType.BOOLEAN.value:
            return flag.value

        elif flag.flag_type == FlagType.PERCENTAGE.value:
            if not flag.rollout_percentage or flag.rollout_percentage >= 100:
                return True

            if user_id and context:
                hash_value = hash(f"{key}_{user_id}_{context.get('tenant_id', '')}")
                rollout = hash_value % 100
                return rollout < flag.rollout_percentage

            return flag.rollout_percentage > 0

        elif flag.flag_type == FlagType.ALLOWLIST.value:
            if user_id:
                return user_id in flag.allowlist
            return False

        elif flag.flag_type == FlagType.BLOCKLIST.value:
            if user_id:
                return user_id not in flag.blocklist
            return True

        return flag.value

    def create_flag(
        self,
        key: str,
        name: str,
        description: str,
        flag_type: str,
        value: Any = False,
        created_by: str = "system",
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Create new feature flag"""
        if key in self.flags:
            logger.error(f"Feature flag {key} already exists")
            return False

        flag = FeatureFlag(
            key=key,
            name=name,
            description=description,
            flag_type=flag_type,
            status=FlagStatus.ENABLED.value if value else FlagStatus.DISABLED.value,
            value=value,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            created_by=created_by,
            tags=tags or [],
            metadata=metadata or {},
        )

        self.flags[key] = flag
        self.save_flags()

        self._log_audit("CREATE", key, created_by, {"name": name, "value": value})

        logger.info(f"Created feature flag: {key}")
        return True

    def update_flag(
        self,
        key: str,
        value: Optional[Any] = None,
        status: Optional[str] = None,
        rollout_percentage: Optional[int] = None,
        allowlist: Optional[Set[str]] = None,
        blocklist: Optional[Set[str]] = None,
        updated_by: str = "system",
    ) -> bool:
        """Update existing feature flag"""
        if key not in self.flags:
            logger.error(f"Feature flag {key} does not exist")
            return False

        flag = self.flags[key]
        changes = {}

        if value is not None:
            changes["value"] = {"old": flag.value, "new": value}
            flag.value = value

        if status is not None:
            changes["status"] = {"old": flag.status, "new": status}
            flag.status = status

        if rollout_percentage is not None:
            changes["rollout_percentage"] = {"old": flag.rollout_percentage, "new": rollout_percentage}
            flag.rollout_percentage = rollout_percentage

        if allowlist is not None:
            changes["allowlist"] = {"old": list(flag.allowlist), "new": list(allowlist)}
            flag.allowlist = allowlist

        if blocklist is not None:
            changes["blocklist"] = {"old": list(flag.blocklist), "new": list(blocklist)}
            flag.blocklist = blocklist

        flag.updated_at = datetime.now().isoformat()
        self.save_flags()

        self._log_audit("UPDATE", key, updated_by, changes)

        logger.info(f"Updated feature flag: {key}")
        return True

    def delete_flag(self, key: str, deleted_by: str = "system") -> bool:
        """Delete feature flag"""
        if key not in self.flags:
            logger.error(f"Feature flag {key} does not exist")
            return False

        flag = self.flags[key]
        del self.flags[key]

        self.save_flags()

        self._log_audit("DELETE", key, deleted_by, {"flag_data": flag.name})

        logger.info(f"Deleted feature flag: {key}")
        return True

    def _log_audit(self, action: str, key: str, actor: str, details: Dict[str, Any]):
        """Log audit entry"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "flag_key": key,
            "actor": actor,
            "details": details,
        }
        self.audit_log.append(entry)

        audit_path = self.config_path.parent / "feature_flag_audit.json"
        with open(audit_path, "w") as f:
            json.dump(self.audit_log[-100:], f, indent=2)

    def get_flags_by_tag(self, tag: str) -> List[FeatureFlag]:
        """Get all flags with specific tag"""
        return [flag for flag in self.flags.values() if tag in flag.tags]

    def get_expired_flags(self) -> List[FeatureFlag]:
        """Get all expired flags"""
        expired = []
        now = datetime.now()

        for flag in self.flags.values():
            if flag.expires_at:
                expires = datetime.fromisoformat(flag.expires_at)
                if now > expires:
                    expired.append(flag)

        return expired

    def generate_report(self) -> Dict[str, Any]:
        """Generate feature flag report"""
        report = {
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_flags": len(self.flags),
                "enabled_flags": sum(1 for f in self.flags.values() if f.status == FlagStatus.ENABLED.value),
                "disabled_flags": sum(1 for f in self.flags.values() if f.status == FlagStatus.DISABLED.value),
                "rolling_out_flags": sum(1 for f in self.flags.values() if f.status == FlagStatus.ROLLING_OUT.value),
                "rolling_back_flags": sum(1 for f in self.flags.values() if f.status == FlagStatus.ROLLING_BACK.value),
                "expired_flags": len(self.get_expired_flags()),
            },
            "flags": {},
            "tags": {},
        }

        for key, flag in self.flags.items():
            report["flags"][key] = {
                "name": flag.name,
                "status": flag.status,
                "type": flag.flag_type,
                "value": flag.value,
                "rollout_percentage": flag.rollout_percentage,
                "tags": flag.tags,
            }

            for tag in flag.tags:
                if tag not in report["tags"]:
                    report["tags"][tag] = 0
                report["tags"][tag] += 1

        return report


# Global instance
feature_flags = FeatureFlagManager()


def is_enabled(key: str, user_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> bool:
    """Convenience function to check if feature flag is enabled"""
    return feature_flags.is_enabled(key, user_id, context)
