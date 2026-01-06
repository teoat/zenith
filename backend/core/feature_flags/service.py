import hashlib
import json
import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from core.cache import cache_service
from core.feature_flags.models import FeatureFlag

logger = logging.getLogger(__name__)


class FeatureFlagService:
    def __init__(self):
        self.cache_ttl = 300  # 5 minutes

    def is_enabled(
        self,
        db: Session,
        flag_name: str,
        user_id: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> bool:
        """
        Check if feature flag is enabled for user/context.
        Synchronous implementation using synchronous Redis cache and DB.
        """
        try:
            # Check cache first
            cache_key = f"feature_flag:{flag_name}:{user_id or 'global'}"
            cached = cache_service.get(cache_key)

            if cached is not None:
                return bool(cached)

            # Fetch from database
            flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()

            if not flag:
                # Flag doesn't exist - default to False
                return False

            if not flag.enabled:
                return False

            # Rollout percentage logic
            if flag.rollout_percentage < 100:
                # Consistent hashing
                hash_input = f"{flag_name}:{user_id or 'anonymous'}"
                user_hash = int(hashlib.md5(hash_input.encode()).hexdigest(), 16) % 100
                if user_hash >= flag.rollout_percentage:
                    return False

            # Target users logic
            if flag.target_users and user_id:
                # target_users is stored as JSON list
                target_users_list = (
                    flag.target_users
                    if isinstance(flag.target_users, list)
                    else json.loads(flag.target_users)
                )
                if user_id not in target_users_list:
                    return False

            # Cache result
            cache_service.set(cache_key, True, self.cache_ttl)
            return True

        except Exception as e:
            logger.error(f"Feature flag check failed for {flag_name}: {e}")
            return False

    def emergency_disable(self, db: Session, flag_name: str, reason: str):
        """
        Emergency kill switch - disable flag immediately
        """
        logger.warning(f"Emergency disabling flag: {flag_name}. Reason: {reason}")
        flag = db.query(FeatureFlag).filter(FeatureFlag.name == flag_name).first()
        if flag:
            flag.enabled = False
            flag.disabled_reason = reason
            flag.disabled_at = datetime.now()
            db.commit()

            # Invalidate cache
            try:
                cache_service.invalidate_pattern(f"feature_flag:{flag_name}:*")
            except Exception as e:
                logger.error(f"Failed to invalidate cache for flag {flag_name}: {e}")


feature_flag_service = FeatureFlagService()
