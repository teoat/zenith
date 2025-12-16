#!/usr/bin/env python3
"""
Feature Flag Management System
Advanced feature flag system for controlled feature rollouts
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Union
from dataclasses import dataclass, field
from enum import Enum
import os
from pathlib import Path

class FeatureFlagState(Enum):
    """Feature flag states"""
    DISABLED = "disabled"
    ENABLED = "enabled"
    ROLLOUT = "rollout"
    MAINTENANCE = "maintenance"

class RolloutStrategy(Enum):
    """Rollout strategies for feature flags"""
    PERCENTAGE = "percentage"
    USER_ID = "user_id"
    EMAIL_DOMAIN = "email_domain"
    IP_RANGE = "ip_range"
    CUSTOM = "custom"

@dataclass
class FeatureFlag:
    """Feature flag definition"""
    name: str
    description: str
    state: FeatureFlagState
    rollout_strategy: RolloutStrategy = RolloutStrategy.PERCENTAGE
    rollout_percentage: float = 0.0
    rollout_users: Set[str] = field(default_factory=set)
    rollout_domains: Set[str] = field(default_factory=set)
    rollout_ip_ranges: List[str] = field(default_factory=list)
    dependencies: Set[str] = field(default_factory=set)
    tags: Set[str] = field(default_factory=set)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_enabled_for_user(self, user_context: Dict[str, Any]) -> bool:
        """Check if feature is enabled for a specific user context"""

        # Check if feature is globally disabled
        if self.state == FeatureFlagState.DISABLED:
            return False

        # Check if feature has expired
        if self.expires_at and datetime.now() > self.expires_at:
            return False

        # Check dependencies
        for dep in self.dependencies:
            if not self._check_dependency(dep, user_context):
                return False

        # Apply rollout strategy
        if self.state == FeatureFlagState.ENABLED:
            return True
        elif self.state == FeatureFlagState.ROLLOUT:
            return self._apply_rollout_strategy(user_context)
        elif self.state == FeatureFlagState.MAINTENANCE:
            return False

        return False

    def _apply_rollout_strategy(self, user_context: Dict[str, Any]) -> bool:
        """Apply the configured rollout strategy"""

        if self.rollout_strategy == RolloutStrategy.PERCENTAGE:
            return self._percentage_rollout(user_context)

        elif self.rollout_strategy == RolloutStrategy.USER_ID:
            return self._user_id_rollout(user_context)

        elif self.rollout_strategy == RolloutStrategy.EMAIL_DOMAIN:
            return self._email_domain_rollout(user_context)

        elif self.rollout_strategy == RolloutStrategy.IP_RANGE:
            return self._ip_range_rollout(user_context)

        elif self.rollout_strategy == RolloutStrategy.CUSTOM:
            return self._custom_rollout(user_context)

        return False

    def _percentage_rollout(self, user_context: Dict[str, Any]) -> bool:
        """Percentage-based rollout"""
        user_id = user_context.get('user_id', '')
        if not user_id:
            return False

        # Use consistent hashing for percentage rollout
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest()[:8], 16)
        percentage = (hash_value % 100) / 100.0
        return percentage <= self.rollout_percentage

    def _user_id_rollout(self, user_context: Dict[str, Any]) -> bool:
        """User ID based rollout"""
        user_id = user_context.get('user_id', '')
        return user_id in self.rollout_users

    def _email_domain_rollout(self, user_context: Dict[str, Any]) -> bool:
        """Email domain based rollout"""
        email = user_context.get('email', '')
        if '@' not in email:
            return False

        domain = email.split('@')[1].lower()
        return domain in self.rollout_domains

    def _ip_range_rollout(self, user_context: Dict[str, Any]) -> bool:
        """IP range based rollout"""
        ip = user_context.get('ip_address', '')
        if not ip:
            return False

        # Simple IP range checking (in production, use proper IP range libraries)
        for ip_range in self.rollout_ip_ranges:
            if ip.startswith(ip_range.split('/')[0]):  # Simple prefix matching
                return True
        return False

    def _custom_rollout(self, user_context: Dict[str, Any]) -> bool:
        """Custom rollout logic"""
        # Placeholder for custom rollout logic
        return self.rollout_percentage > 0

    def _check_dependency(self, dependency: str, user_context: Dict[str, Any]) -> bool:
        """Check if a dependency feature flag is enabled"""
        # In a real implementation, this would check other feature flags
        return True  # Placeholder

class FeatureFlagManager:
    """Central feature flag management system"""

    def __init__(self, config_file: str = "feature_flags.json"):
        self.config_file = Path(config_file)
        self.feature_flags: Dict[str, FeatureFlag] = {}
        self.load_flags()

    def load_flags(self):
        """Load feature flags from configuration file"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    data = json.load(f)

                for flag_data in data.get('feature_flags', []):
                    flag = FeatureFlag(**flag_data)
                    self.feature_flags[flag.name] = flag

                print(f"✅ Loaded {len(self.feature_flags)} feature flags")

            except Exception as e:
                print(f"❌ Error loading feature flags: {e}")
        else:
            print("⚠️ No feature flags configuration found, starting with empty set")

    def save_flags(self):
        """Save feature flags to configuration file"""
        try:
            data = {
                'last_updated': datetime.now().isoformat(),
                'feature_flags': [
                    {
                        'name': flag.name,
                        'description': flag.description,
                        'state': flag.state.value,
                        'rollout_strategy': flag.rollout_strategy.value,
                        'rollout_percentage': flag.rollout_percentage,
                        'rollout_users': list(flag.rollout_users),
                        'rollout_domains': list(flag.rollout_domains),
                        'rollout_ip_ranges': flag.rollout_ip_ranges,
                        'dependencies': list(flag.dependencies),
                        'tags': list(flag.tags),
                        'created_at': flag.created_at.isoformat(),
                        'updated_at': flag.updated_at.isoformat(),
                        'expires_at': flag.expires_at.isoformat() if flag.expires_at else None,
                        'metadata': flag.metadata
                    }
                    for flag in self.feature_flags.values()
                ]
            }

            with open(self.config_file, 'w') as f:
                json.dump(data, f, indent=2)

            print(f"✅ Saved {len(self.feature_flags)} feature flags")

        except Exception as e:
            print(f"❌ Error saving feature flags: {e}")

    def create_flag(self, name: str, description: str, **kwargs) -> FeatureFlag:
        """Create a new feature flag"""
        if name in self.feature_flags:
            raise ValueError(f"Feature flag {name} already exists")

        flag = FeatureFlag(name=name, description=description, **kwargs)
        self.feature_flags[name] = flag
        self.save_flags()
        print(f"✅ Created feature flag: {name}")
        return flag

    def update_flag(self, name: str, **updates) -> Optional[FeatureFlag]:
        """Update an existing feature flag"""
        if name not in self.feature_flags:
            print(f"❌ Feature flag {name} not found")
            return None

        flag = self.feature_flags[name]

        # Update attributes
        for key, value in updates.items():
            if hasattr(flag, key):
                if key in ['rollout_users', 'rollout_domains', 'dependencies', 'tags']:
                    setattr(flag, key, set(value) if isinstance(value, list) else value)
                else:
                    setattr(flag, key, value)

        flag.updated_at = datetime.now()
        self.save_flags()
        print(f"✅ Updated feature flag: {name}")
        return flag

    def delete_flag(self, name: str) -> bool:
        """Delete a feature flag"""
        if name not in self.feature_flags:
            print(f"❌ Feature flag {name} not found")
            return False

        del self.feature_flags[name]
        self.save_flags()
        print(f"✅ Deleted feature flag: {name}")
        return True

    def is_enabled(self, flag_name: str, user_context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if a feature flag is enabled for the given context"""
        user_context = user_context or {}

        if flag_name not in self.feature_flags:
            return False

        return self.feature_flags[flag_name].is_enabled_for_user(user_context)

    def get_flag_status(self, flag_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed status of a feature flag"""
        if flag_name not in self.feature_flags:
            return None

        flag = self.feature_flags[flag_name]
        return {
            'name': flag.name,
            'description': flag.description,
            'state': flag.state.value,
            'rollout_strategy': flag.rollout_strategy.value,
            'rollout_percentage': flag.rollout_percentage,
            'enabled_for_current_user': flag.is_enabled_for_user({}),
            'expires_at': flag.expires_at.isoformat() if flag.expires_at else None,
            'tags': list(flag.tags),
            'dependencies': list(flag.dependencies)
        }

    def list_flags(self, tag_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all feature flags, optionally filtered by tag"""
        flags = []

        for flag in self.feature_flags.values():
            if tag_filter and tag_filter not in flag.tags:
                continue

            flags.append({
                'name': flag.name,
                'description': flag.description,
                'state': flag.state.value,
                'tags': list(flag.tags),
                'updated_at': flag.updated_at.isoformat()
            })

        return flags

    def enable_flag(self, name: str, rollout_percentage: float = 100.0) -> bool:
        """Enable a feature flag with optional rollout percentage"""
        return self.update_flag(
            name,
            state=FeatureFlagState.ENABLED,
            rollout_percentage=rollout_percentage
        ) is not None

    def disable_flag(self, name: str) -> bool:
        """Disable a feature flag"""
        return self.update_flag(
            name,
            state=FeatureFlagState.DISABLED,
            rollout_percentage=0.0
        ) is not None

    def start_rollout(self, name: str, percentage: float, strategy: RolloutStrategy = RolloutStrategy.PERCENTAGE) -> bool:
        """Start a gradual rollout of a feature flag"""
        return self.update_flag(
            name,
            state=FeatureFlagState.ROLLOUT,
            rollout_strategy=strategy,
            rollout_percentage=percentage
        ) is not None

# Global feature flag manager instance
feature_flag_manager = FeatureFlagManager()

# Convenience functions for easy use
def is_feature_enabled(feature_name: str, user_context: Optional[Dict[str, Any]] = None) -> bool:
    """Check if a feature is enabled"""
    return feature_flag_manager.is_enabled(feature_name, user_context)

def create_feature_flag(name: str, description: str, **kwargs) -> FeatureFlag:
    """Create a new feature flag"""
    return feature_flag_manager.create_flag(name, description, **kwargs)

def update_feature_flag(name: str, **updates) -> Optional[FeatureFlag]:
    """Update a feature flag"""
    return feature_flag_manager.update_flag(name, **updates)

def delete_feature_flag(name: str) -> bool:
    """Delete a feature flag"""
    return feature_flag_manager.delete_flag(name)

def list_feature_flags(tag_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """List feature flags"""
    return feature_flag_manager.list_flags(tag_filter)

# Initialize with some default feature flags
def initialize_default_flags():
    """Initialize default feature flags for the fraud detection platform"""

    default_flags = [
        {
            'name': 'ai_ml_governance',
            'description': 'Enable AI/ML governance features',
            'state': FeatureFlagState.ROLLOUT,
            'rollout_percentage': 25.0,
            'tags': {'ai', 'governance', 'compliance'},
            'dependencies': set()
        },
        {
            'name': 'advanced_fraud_detection',
            'description': 'Enable advanced fraud detection algorithms',
            'state': FeatureFlagState.ENABLED,
            'tags': {'fraud', 'detection', 'ai'},
            'dependencies': {'ai_ml_governance'}
        },
        {
            'name': 'real_time_monitoring',
            'description': 'Enable real-time transaction monitoring',
            'state': FeatureFlagState.ENABLED,
            'tags': {'monitoring', 'real-time', 'performance'},
            'dependencies': set()
        },
        {
            'name': 'automated_response',
            'description': 'Enable automated response to fraud alerts',
            'state': FeatureFlagState.ROLLOUT,
            'rollout_percentage': 10.0,
            'tags': {'automation', 'response', 'alerts'},
            'dependencies': {'real_time_monitoring'}
        },
        {
            'name': 'quantum_acceleration',
            'description': 'Enable quantum-accelerated processing (future feature)',
            'state': FeatureFlagState.DISABLED,
            'tags': {'quantum', 'performance', 'experimental'},
            'dependencies': set()
        }
    ]

    created_count = 0
    for flag_config in default_flags:
        try:
            if flag_config['name'] not in feature_flag_manager.feature_flags:
                feature_flag_manager.create_flag(**flag_config)
                created_count += 1
        except Exception as e:
            print(f"Warning: Could not create default flag {flag_config['name']}: {e}")

    if created_count > 0:
        print(f"✅ Initialized {created_count} default feature flags")

# Initialize on import
try:
    initialize_default_flags()
except Exception as e:
    print(f"Warning: Could not initialize default feature flags: {e}")

if __name__ == "__main__":
    # Demo of feature flag system
    print("🚩 FEATURE FLAG MANAGEMENT SYSTEM DEMO")
    print("=" * 50)

    # Test feature flag evaluation
    test_user = {
        'user_id': 'user123',
        'email': 'user@company.com',
        'ip_address': '192.168.1.100'
    }

    print("\n🔍 Testing feature flags for user:")
    print(f"  User ID: {test_user['user_id']}")
    print(f"  Email: {test_user['email']}")

    flags_to_test = ['ai_ml_governance', 'advanced_fraud_detection', 'real_time_monitoring', 'automated_response']
    for flag_name in flags_to_test:
        enabled = is_feature_enabled(flag_name, test_user)
        print(f"  {flag_name}: {'✅ ENABLED' if enabled else '❌ DISABLED'}")

    print("\n📊 Feature Flag Summary:")
    flags = list_feature_flags()
    print(f"  Total flags: {len(flags)}")
    for flag in flags[:3]:  # Show first 3
        print(f"  - {flag['name']}: {flag['state']} ({', '.join(flag['tags'])})")

    print(f"\n💾 Configuration saved to: {feature_flag_manager.config_file}")