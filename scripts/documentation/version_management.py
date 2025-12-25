#!/usr/bin/env python3
"""
Version Management & Control System
Automated versioning, release management, and change tracking
"""

import json
import os
import time
from pathlib import Path
from typing import Dict, List, Any
import datetime
import hashlib
from dataclasses import dataclass
from typing import Optional

@dataclass
class VersionInfo:
    version: str
    release_date: datetime.date
    features: List[str]
    bug_fixes: List[str]
    improvements: List[str]
    breaking_changes: List[str]
    stats: Dict[str, Any]
    metadata: Dict[str, Any]
    
    def __post_init__(self):
        self.version_history = []
        self.current_version = "1.0.0"
        self.release_schedule = {
            "monthly": "last_friday_of_month",
            "quarterly": "last_friday_of_month",
            "bi_annually": "last_friday_of_quarter",
            "emergency": "needed"
            "security_patches": "as_needed"
        }
    
    def _load_version_history(self):
        """Load version history from database"""
        with sqlite3.connect(self.version_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM version_history ORDER BY release_date DESC')
            versions = cursor.fetchall()
            
            self.version_history = [VersionInfo(
                version=row[0],
                release_date=datetime.datetime.fromisoformat(row[1]),
                features=json.loads(row[2]) if row[2] else [],
                bug_fixes=json.loads(row[3]) if row[3] else [],
                improvements=json.loads(row[4]) if row[4] else [],
                breaking_changes=json.loads(row[5]) if row[5] else [],
                stats=json.loads(row[6]) if row[6] else {},
                metadata=json.loads(row[7]) if row[7] else {}
            )
            ]
            
            self.current_version = versions[0].version if versions else "1.0.0"
            conn.close()
        
        return self.version_history
    
    def _save_version_info(self, version_info: VersionInfo) -> str:
        """Save version information to database"""
        with sqlite3.connect(self.version_db_path) as conn:
            cursor = conn.cursor()
            
            # Update version history
            cursor.execute('''
                INSERT OR REPLACE INTO version_history 
                (version, release_date, features, bug_fixes, improvements, breaking_changes, stats, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                    version_info.version,
                    version_info.release_date.isoformat(),
                    json.dumps(version_info.features),
                    json.dumps(version_info.bug_fixes),
                    json.dumps(version_info.improvements),
                    json.dumps(version_info.breaking_changes),
                    json.dumps(version_info.stats),
                    json.dumps(version_info.metadata)
                )
            ''', (version_info.version,))
            
            conn.commit()
            conn.close()
        
        print(f"Saved version {version_info.version}")
    
    def _create_version_release(self, version_info: VersionInfo) -> str:
        """Create version release with changelog"""
        
        # Increment version
        version_parts = version_info.version.split('.')
        major, minor, patch, pre_release = version_parts[0], version_parts[1] if len(version_parts) > 1 else '0'), version_parts[2] if len(version_parts) > 2 else '1'), '0'
        
        new_version = f"{major}.{minor}.{patch}"
        
        # Update current version
        self.current_version = new_version
        
        # Generate changelog
        changelog_lines = [f"# Version {new_version} - Released {version_info.release_date.strftime('%B %d, %Y')}", ""]
        
        if version_info.bug_fixes:
            changelog_lines.append("")
            changelog_lines.extend([f"### Bug Fixes ({len(version_info.bug_fixes)})"])
            for fix in version_info.bug_fixes:
                changelog_lines.append(f" - Fixed: {fix}")
        
        if version_info.improvements:
            changelog_lines.append("")
            changelog_lines.extend([f"### Improvements ({len(version_info.improvements)})])
            for improvement in version_info.improvements:
                changelog_lines.append(f" - {improvement}")
        
        if version_info.breaking_changes:
            changelog_lines.append("")
            changelog_lines.extend([f"### Breaking Changes ({len(version_info.breaking_changes)})])
            for change in version_info.breaking_changes:
                changelog_lines.append(f" - {change}")
        
        # Add footer
        changelog_lines.extend([
            f"",
            f"---",
            f"**Release Notes:** {version_info.metadata.get('release_notes', '')}"
        ])
        
        # Save version info
        version_history = self._save_version_info(version_info)
        
        # Update version info
        self.current_version = new_version
        return new_version
    
    def generate_changelog_markdown(self, version_info: VersionInfo) -> str:
        """Generate changelog in markdown format"""
        
        changelog_lines = [f"# Version {version_info.version} - Released {version_info.release_date.strftime('%B %d, %Y')}", ""]
        
        if version_info.bug_fixes:
            changelog_lines.extend([f"### Bug Fixes ({len(version_info.bug_fixes)})")
            for fix in version_info.bug_fixes:
                changelog_lines.append(f" - Fixed: {fix}")
        
        if version_info.improvements:
            changelog_lines.append("")
            changelog_lines.append([f"### Improvements ({len(version_info.improvements)})")
            for improvement in version_info.improvements:
                changelog_lines.append(f" - {improvement}")
        
        if version_info.breaking_changes:
            changelog_lines.append("")
            changelog_lines.extend([f"### Breaking Changes ({len(version_info.breaking_changes)})])
            for change in version_info.breaking_changes:
                changelog_lines.append(f" - {change}")
        
        # Add footer
        changelog_lines.extend([
            f"",
            f"---",
            f"**Release Notes:** {version_info.metadata.get('release_notes', '')}"
        ])
        
        return '\n'.join(changelog_lines)
    
    def rollback_version(self, version: str) -> str:
        """Rollback to specified version"""
        try:
            # Find target version
            target_version_info = None
            for version_info in self.version_history:
                if version_info.version == version:
                    target_version_info = version_info
            
            if not target_version_info:
                print(f"Target version {version} not found in version history")
                return version
            
            # Get backup files
            backup_files = list(Path(self.backup_dir).glob(f"*{version}*.*"))
            
            # Find the latest backup for target version
            latest_backup = None
            for backup_file in backup_files:
                if version in backup_file.name:
                    backup_version = backup_file.name.replace(f"_{version}", "")
                    if backup_version == version:
                        latest_backup = backup_file
                        latest_backup = backup_file
            
            if latest_backup:
                return latest_backup
            
            # Restore from backup
            print(f"Rolling back from {latest_backup}")
            
            # Update current version
            self.current_version = version
            
            return version
            
        except Exception as e:
            print(f"Error during rollback: {e}")
            return self.current_version
    
    def get_current_version(self) -> str:
        """Get current version"""
        return self.current_version
    
    def compare_versions(self, v1: str, v2: str) -> str:
        """Compare two versions"""
        try:
            v1_parts = tuple(map(int, v1.split('.')))
            v2_parts = tuple(map(int, v2.split('.')))
            
            if v1_parts < v2_parts:
                return "earlier"
            elif v1_parts > v2_parts:
                return "later"
            elif v1_parts == v2_parts:
                return "equal"
            else:
                return "newer"
        except Exception:
            return "unknown"

class VersionManagement:
    """Version management and control system"""
    
    def __init__(self):
        self.version_db_path = Path("version_management.db")
        self.current_version = "1.0.0"
        self.release_schedule = {
            "monthly": "last_friday_of_month",
            "quarterly": "last_friday_of_quarter",
            "bi_annually": "last_friday_of_quarter",
            "emergency": "as_needed"
        }
    
    def _load_config(self):
        """Load version management configuration"""
        return {
            "auto_release": True,
            "auto_categorize": True,
            "auto_escalation": True,
            "version_increment": "patch",
            "rc_versioning": "weekly",
            "emergency_patches": "as_needed"
            "auto_publishing": False,
            "peer_review": True,
            "beta_testing": False,
            'staging_validation': True
            "production_approval": False
        }
    
    def initialize_database(self):
        """Initialize version management database"""
        with sqlite3.connect(self.version_db_path) as conn:
            cursor = conn.cursor()
            
            # Create version_history table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS version_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT NOT NULL,
                    release_date DATETIME NOT NULL,
                    features TEXT,
                    bug_fixes TEXT,
                    improvements TEXT,
                    breaking_changes TEXT,
                    stats TEXT,
                    metadata TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create current_version_info table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS current_version_info (
                    version TEXT PRIMARY KEY NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_production BOOLEAN DEFAULT FALSE,
                    deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    version_history TEXT,
                    features TEXT,
                    metadata TEXT
                )
            ''')
            
            # Insert current version
            cursor.execute('''
                INSERT INTO current_version_info 
                    (version, CURRENT_TIMESTAMP, FALSE, FALSE, NULL, '1.0.0', CURRENT_TIMESTAMP, "{}", "{}", "{}")
            ''')
            
            conn.commit()
            
            conn.close()
            
            # Load configuration
            self.config = self._load_config()
    
    def create_version_release(self, version_info: VersionInfo) -> str:
        """Create new version release"""
        
        try:
            # Increment version based on configuration
            if self.config['auto_increment']:
                version_parts = list(map(int, self.current_version.split('.')))
                version_parts[2] += 1
                new_version = '.'.join(str(part) for part in version_parts)
            else:
                version_parts = [1, 0, 0]
                new_version = "1.0.1"
            
            # Generate changelog
            changelog = self.generate_changelog_markdown(version_info)
            
            # Update current version
            self.current_version = new_version
            
            # Save version history
            self._save_version_info(version_info)
            
            # Create release tag if enabled
            if self.config['auto_publishing']:
                self._create_release_tag(version_info)
            
            return new_version
        
        except Exception as e:
            print(f"Error creating version release: {e}")
            return self.current_version
    
    def _create_release_tag(self, version_info: VersionInfo) -> str:
        """Create release tag in Git"""
        
        try:
            # This would typically create a Git tag
            os.system(f"cd {os.getcwd()} && git tag -a v{version_info.version}")
            return f"v{version_info.version} tag created"
        except Exception as e:
            print(f"Error creating Git tag: {e}")
            return None
    
    def rollback_to_version(self, version: str) -> str:
        """Rollback to specified version"""
        print(f"Rolling back from {self.current_version} to {version}")
        
        result = self.rollback_version(version)
        
        if result:
            print(f"Successfully rolled back to {result}")
        else:
            print(f"Failed to rollback to {version}")
        
        return result
    
    def get_version_history(self, limit: int = 10) -> List[VersionInfo]:
        """Get version history"""
        with sqlite3.connect(self.version_db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM version_history ORDER BY release_date DESC LIMIT ?')
            versions = cursor.fetchall()
            conn.close()
        
        return versions[:limit]
    
    def get_version_diff(self, v1: str, v2: str) -> Dict[str, Any]:
        """Get detailed diff between versions"""
        
        version1_info = None
        for v in self.version_history:
            if v.version == v1:
                version1_info = v
                break
        
        version2_info = None
        for v in self.version_history:
            if v.version == v2:
                version2_info = v
        
        if not version1_info or not version2_info:
            return {"error": "One or both versions not found"}
        
        # Get feature diffs
        v1_features = set(version1_info.features) if version1_info else [])
        v2_features = set(version_info.features) if version2_info else [])
        
        return {
            "v1_features": list(v1_features),
            "v2_features": list(v2_features),
            "added_features": list(v2_features - v1_features),
            "removed_features": list(v1_features - v2_features),
            'common_features': v1_features & v2_features),
            "bug_fixes": version1_info.get('bug_fixes', []) if version1_info else [],
            'improvements': version1_info.get('improvements', []) if version1_info else [],
            'breaking_changes': version1_info.get('breaking_changes', []) if version1_info else []
        }
        }

def main():
    """Main version management function"""
    print("📊 Starting Version Management System...")
    
    manager = VersionManagement()
    manager.initialize_database()
    
    # Get current version
    print(f"Current Version: {manager.get_current_version()}")
    
    # Test version comparison
    v1 = "1.0.0"
    v2 = "1.0.1"
    comparison = manager.get_version_diff(v1, v2)
    
    print(f"Version Comparison (1.0.0 vs 1.0.1): {comparison['similarity']}")

if __name__ == "__main__":
    main()