"""
Enterprise Backup and Disaster Recovery System
Provides comprehensive backup, recovery, and business continuity capabilities
"""

import os
import asyncio
import logging
import shutil
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import sqlite3
import gzip
import tarfile
from concurrent.futures import ThreadPoolExecutor
import threading
import time

logger = logging.getLogger(__name__)

class BackupManager:
    """
    Enterprise-grade backup and disaster recovery manager
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = {
            'backup_dir': './data/backups',
            'database_path': './data/fraud_detection.db',
            'evidence_dir': './data/evidence',
            'config_dir': './data/config',
            'retention_days': 30,
            'max_backup_size_gb': 10,
            'compression_level': 6,
            'encryption_enabled': True,
            'remote_backup_enabled': False,
            'remote_backup_url': '',
            'backup_schedule': '0 2 * * *',  # Daily at 2 AM
            'full_backup_interval_days': 7,
            'incremental_backup_enabled': True,
            **config
        }

        # Create backup directories
        self.backup_base_dir = Path(self.config['backup_dir'])
        self.full_backup_dir = self.backup_base_dir / 'full'
        self.incremental_backup_dir = self.backup_base_dir / 'incremental'
        self.temp_dir = self.backup_base_dir / 'temp'

        for dir_path in [self.backup_base_dir, self.full_backup_dir,
                        self.incremental_backup_dir, self.temp_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

        # Backup metadata
        self.metadata_file = self.backup_base_dir / 'backup_metadata.json'
        self.backup_metadata = self._load_metadata()

        # Thread pool for parallel operations
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Backup state
        self.is_backup_running = False
        self.last_backup_time = None
        self.backup_stats = {
            'total_backups': 0,
            'successful_backups': 0,
            'failed_backups': 0,
            'total_size_gb': 0.0,
            'last_backup_duration': 0,
            'compression_ratio': 0.0
        }

        logger.info("Backup Manager initialized")

    def _load_metadata(self) -> Dict[str, Any]:
        """Load backup metadata from disk"""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load backup metadata: {e}")

        return {
            'backups': [],
            'last_full_backup': None,
            'last_incremental_backup': None,
            'backup_chain': []
        }

    def _save_metadata(self):
        """Save backup metadata to disk"""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.backup_metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save backup metadata: {e}")

    async def create_full_backup(self, reason: str = "scheduled") -> Dict[str, Any]:
        """
        Create a full backup of all system data
        """
        if self.is_backup_running:
            raise Exception("Backup already in progress")

        self.is_backup_running = True
        start_time = time.time()

        try:
            logger.info(f"Starting full backup: {reason}")

            # Generate backup ID
            backup_id = f"full_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            backup_dir = self.full_backup_dir / backup_id
            backup_dir.mkdir(exist_ok=True)

            # Backup components
            components = {
                'database': await self._backup_database(backup_dir),
                'evidence': await self._backup_evidence(backup_dir),
                'config': await self._backup_config(backup_dir),
                'metadata': await self._backup_metadata(backup_dir)
            }

            # Create compressed archive
            archive_path = await self._create_archive(backup_id, backup_dir, components)

            # Calculate integrity hash
            integrity_hash = await self._calculate_integrity_hash(archive_path)

            # Update metadata
            backup_info = {
                'id': backup_id,
                'type': 'full',
                'timestamp': datetime.now().isoformat(),
                'reason': reason,
                'components': components,
                'archive_path': str(archive_path),
                'size_bytes': archive_path.stat().st_size,
                'integrity_hash': integrity_hash,
                'compression_ratio': components.get('compression_ratio', 0),
                'duration_seconds': time.time() - start_time
            }

            self.backup_metadata['backups'].append(backup_info)
            self.backup_metadata['last_full_backup'] = backup_info['timestamp']
            self._save_metadata()

            # Update stats
            self._update_backup_stats(backup_info, True)

            # Cleanup old backups
            await self._cleanup_old_backups()

            # Remote backup if enabled
            if self.config['remote_backup_enabled']:
                await self._upload_to_remote(archive_path, backup_info)

            logger.info(f"Full backup completed: {backup_id}")
            return backup_info

        except Exception as e:
            logger.error(f"Full backup failed: {e}")
            self._update_backup_stats({'duration_seconds': time.time() - start_time}, False)
            raise
        finally:
            self.is_backup_running = False
            self.last_backup_time = datetime.now()

    async def create_incremental_backup(self, reason: str = "scheduled") -> Dict[str, Any]:
        """
        Create an incremental backup since last full backup
        """
        if self.is_backup_running:
            raise Exception("Backup already in progress")

        last_full = self.backup_metadata.get('last_full_backup')
        if not last_full:
            # No full backup exists, create one instead
            return await self.create_full_backup(reason)

        self.is_backup_running = True
        start_time = time.time()

        try:
            logger.info(f"Starting incremental backup: {reason}")

            # Generate backup ID
            backup_id = f"inc_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            backup_dir = self.incremental_backup_dir / backup_id
            backup_dir.mkdir(exist_ok=True)

            # Get changes since last full backup
            last_full_datetime = datetime.fromisoformat(last_full.replace('Z', '+00:00'))
            changes = await self._get_changes_since(last_full_datetime)

            if not changes:
                logger.info("No changes detected, skipping incremental backup")
                return None

            # Backup changed components
            components = await self._backup_changed_components(backup_dir, changes)

            # Create compressed archive
            archive_path = await self._create_archive(backup_id, backup_dir, components)

            # Calculate integrity hash
            integrity_hash = await self._calculate_integrity_hash(archive_path)

            # Update metadata
            backup_info = {
                'id': backup_id,
                'type': 'incremental',
                'timestamp': datetime.now().isoformat(),
                'reason': reason,
                'base_backup': self.backup_metadata['last_full_backup'],
                'components': components,
                'changes': changes,
                'archive_path': str(archive_path),
                'size_bytes': archive_path.stat().st_size,
                'integrity_hash': integrity_hash,
                'compression_ratio': components.get('compression_ratio', 0),
                'duration_seconds': time.time() - start_time
            }

            self.backup_metadata['backups'].append(backup_info)
            self.backup_metadata['last_incremental_backup'] = backup_info['timestamp']
            self._save_metadata()

            # Update stats
            self._update_backup_stats(backup_info, True)

            logger.info(f"Incremental backup completed: {backup_id}")
            return backup_info

        except Exception as e:
            logger.error(f"Incremental backup failed: {e}")
            self._update_backup_stats({'duration_seconds': time.time() - start_time}, False)
            raise
        finally:
            self.is_backup_running = False

    async def _backup_database(self, backup_dir: Path) -> Dict[str, Any]:
        """Backup the SQLite database"""
        db_path = Path(self.config['database_path'])
        if not db_path.exists():
            return {'status': 'skipped', 'reason': 'Database not found'}

        backup_path = backup_dir / 'database.db'

        # Use SQLite backup API for consistency
        await asyncio.get_event_loop().run_in_executor(
            self.executor,
            self._backup_sqlite_database,
            str(db_path),
            str(backup_path)
        )

        size = backup_path.stat().st_size
        return {
            'status': 'completed',
            'original_size': db_path.stat().st_size,
            'backup_size': size,
            'path': str(backup_path)
        }

    def _backup_sqlite_database(self, source_path: str, dest_path: str):
        """Backup SQLite database using SQLite backup API"""
        with sqlite3.connect(source_path) as source:
            with sqlite3.connect(dest_path) as dest:
                source.backup(dest)

    async def _backup_evidence(self, backup_dir: Path) -> Dict[str, Any]:
        """Backup evidence files"""
        evidence_dir = Path(self.config['evidence_dir'])
        if not evidence_dir.exists():
            return {'status': 'skipped', 'reason': 'Evidence directory not found'}

        backup_path = backup_dir / 'evidence'
        total_size = 0
        file_count = 0

        # Copy evidence directory
        if evidence_dir.exists():
            shutil.copytree(evidence_dir, backup_path, dirs_exist_ok=True)

            # Calculate total size
            for file_path in backup_path.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
                    file_count += 1

        return {
            'status': 'completed',
            'file_count': file_count,
            'total_size': total_size,
            'path': str(backup_path)
        }

    async def _backup_config(self, backup_dir: Path) -> Dict[str, Any]:
        """Backup configuration files"""
        config_files = [
            '.env',
            'electron/main.js',
            'backend/main.py',
            'package.json',
            'backend/requirements.txt'
        ]

        backup_path = backup_dir / 'config'
        backup_path.mkdir(exist_ok=True)

        backed_up_files = []

        for config_file in config_files:
            source_path = Path(config_file)
            if source_path.exists():
                dest_path = backup_path / source_path.name
                shutil.copy2(source_path, dest_path)
                backed_up_files.append({
                    'file': config_file,
                    'size': dest_path.stat().st_size
                })

        return {
            'status': 'completed',
            'files': backed_up_files,
            'path': str(backup_path)
        }

    async def _backup_metadata(self, backup_dir: Path) -> Dict[str, Any]:
        """Backup system metadata"""
        metadata_path = backup_dir / 'system_metadata.json'

        metadata = {
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'system_info': {
                'platform': os.uname().sysname if hasattr(os, 'uname') else 'Unknown',
                'python_version': f"{os.sys.version_info.major}.{os.sys.version_info.minor}",
                'node_version': await self._get_node_version()
            },
            'backup_config': self.config,
            'backup_stats': self.backup_stats
        }

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)

        return {
            'status': 'completed',
            'path': str(metadata_path),
            'size': metadata_path.stat().st_size
        }

    async def _get_node_version(self) -> str:
        """Get Node.js version"""
        try:
            process = await asyncio.create_subprocess_exec(
                'node', '--version',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()
            return stdout.decode().strip()
        except:
            return 'Unknown'

    async def _create_archive(self, backup_id: str, backup_dir: Path,
                            components: Dict[str, Any]) -> Path:
        """Create compressed archive of backup"""
        archive_name = f"{backup_id}.tar.gz"
        archive_path = self.backup_base_dir / archive_name

        # Calculate total size before compression
        total_size = 0
        for root, dirs, files in os.walk(backup_dir):
            for file in files:
                total_size += os.path.getsize(os.path.join(root, file))

        # Create compressed archive
        with tarfile.open(archive_path, 'w:gz',
                         compresslevel=self.config['compression_level']) as tar:
            tar.add(backup_dir, arcname=backup_id)

        # Calculate compression ratio
        compressed_size = archive_path.stat().st_size
        compression_ratio = total_size / compressed_size if compressed_size > 0 else 0

        components['compression_ratio'] = compression_ratio
        components['original_size'] = total_size
        components['compressed_size'] = compressed_size

        return archive_path

    async def _calculate_integrity_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 integrity hash of backup file"""
        hash_sha256 = hashlib.sha256()

        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)

        return hash_sha256.hexdigest()

    async def _get_changes_since(self, since_datetime: datetime) -> Dict[str, Any]:
        """Get changes since specified datetime"""
        changes = {
            'database_modified': await self._check_database_changes(since_datetime),
            'evidence_modified': await self._check_evidence_changes(since_datetime),
            'config_modified': await self._check_config_changes(since_datetime)
        }

        # Return changes if any component has been modified
        return changes if any(changes.values()) else {}

    async def _check_database_changes(self, since: datetime) -> bool:
        """Check if database has been modified since given time"""
        db_path = Path(self.config['database_path'])
        if not db_path.exists():
            return False

        mtime = datetime.fromtimestamp(db_path.stat().st_mtime)
        return mtime > since

    async def _check_evidence_changes(self, since: datetime) -> bool:
        """Check if evidence has been modified since given time"""
        evidence_dir = Path(self.config['evidence_dir'])
        if not evidence_dir.exists():
            return False

        for file_path in evidence_dir.rglob('*'):
            if file_path.is_file():
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if mtime > since:
                    return True
        return False

    async def _check_config_changes(self, since: datetime) -> bool:
        """Check if configuration has been modified since given time"""
        config_files = ['.env', 'package.json', 'backend/requirements.txt']

        for config_file in config_files:
            file_path = Path(config_file)
            if file_path.exists():
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if mtime > since:
                    return True
        return False

    async def _backup_changed_components(self, backup_dir: Path,
                                       changes: Dict[str, Any]) -> Dict[str, Any]:
        """Backup only changed components for incremental backup"""
        components = {}

        if changes.get('database_modified'):
            components['database'] = await self._backup_database(backup_dir)

        if changes.get('evidence_modified'):
            components['evidence'] = await self._backup_evidence(backup_dir)

        if changes.get('config_modified'):
            components['config'] = await self._backup_config(backup_dir)

        # Always backup metadata
        components['metadata'] = await self._backup_metadata(backup_dir)

        return components

    def _update_backup_stats(self, backup_info: Dict[str, Any], success: bool):
        """Update backup statistics"""
        self.backup_stats['total_backups'] += 1

        if success:
            self.backup_stats['successful_backups'] += 1
            self.backup_stats['last_backup_duration'] = backup_info.get('duration_seconds', 0)

            size_gb = backup_info.get('size_bytes', 0) / (1024**3)
            self.backup_stats['total_size_gb'] += size_gb

            if 'compression_ratio' in backup_info:
                self.backup_stats['compression_ratio'] = backup_info['compression_ratio']
        else:
            self.backup_stats['failed_backups'] += 1

    async def _cleanup_old_backups(self):
        """Remove backups older than retention period"""
        cutoff_date = datetime.now() - timedelta(days=self.config['retention_days'])

        removed_count = 0

        # Clean full backups
        for backup_dir in self.full_backup_dir.iterdir():
            if backup_dir.is_dir():
                try:
                    backup_date = datetime.strptime(backup_dir.name.split('_')[1], '%Y%m%d_%H%M%S')
                    if backup_date < cutoff_date:
                        shutil.rmtree(backup_dir)
                        removed_count += 1
                except:
                    pass

        # Clean incremental backups
        for backup_dir in self.incremental_backup_dir.iterdir():
            if backup_dir.is_dir():
                try:
                    backup_date = datetime.strptime(backup_dir.name.split('_')[1], '%Y%m%d_%H%M%S')
                    if backup_date < cutoff_date:
                        shutil.rmtree(backup_dir)
                        removed_count += 1
                except:
                    pass

        # Clean archive files
        for archive_file in self.backup_base_dir.glob('*.tar.gz'):
            try:
                # Extract date from filename
                filename = archive_file.name
                if '_full_' in filename:
                    date_part = filename.split('_full_')[1].split('.')[0]
                elif '_inc_' in filename:
                    date_part = filename.split('_inc_')[1].split('.')[0]
                else:
                    continue

                backup_date = datetime.strptime(date_part, '%Y%m%d_%H%M%S')
                if backup_date < cutoff_date:
                    archive_file.unlink()
                    removed_count += 1
            except:
                pass

        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} old backup files")

    async def _upload_to_remote(self, archive_path: Path, backup_info: Dict[str, Any]):
        """Upload backup to remote storage"""
        try:
            # This would implement remote backup to S3, Azure, etc.
            # For now, just log the intent
            logger.info(f"Remote backup upload would happen here: {archive_path}")
        except Exception as e:
            logger.error(f"Remote backup upload failed: {e}")

    async def restore_backup(self, backup_id: str, target_dir: str = None) -> Dict[str, Any]:
        """
        Restore system from backup
        """
        if self.is_backup_running:
            raise Exception("Cannot restore while backup is running")

        try:
            logger.info(f"Starting restore from backup: {backup_id}")

            # Find backup
            backup_info = None
            for backup in self.backup_metadata['backups']:
                if backup['id'] == backup_id:
                    backup_info = backup
                    break

            if not backup_info:
                raise Exception(f"Backup {backup_id} not found")

            # Determine restore target
            restore_base = Path(target_dir) if target_dir else Path('./restore')
            restore_base.mkdir(parents=True, exist_ok=True)

            # Extract archive
            archive_path = Path(backup_info['archive_path'])
            if not archive_path.exists():
                raise Exception(f"Backup archive not found: {archive_path}")

            # Verify integrity
            current_hash = await self._calculate_integrity_hash(archive_path)
            if current_hash != backup_info['integrity_hash']:
                raise Exception("Backup integrity check failed")

            # Extract archive
            with tarfile.open(archive_path, 'r:gz') as tar:
                tar.extractall(restore_base)

            # Restore components
            restore_results = await self._restore_components(
                restore_base / backup_info['id'],
                backup_info
            )

            logger.info(f"Restore completed from backup: {backup_id}")
            return {
                'success': True,
                'backup_id': backup_id,
                'restore_path': str(restore_base),
                'components': restore_results
            }

        except Exception as e:
            logger.error(f"Restore failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def _restore_components(self, backup_dir: Path,
                                backup_info: Dict[str, Any]) -> Dict[str, Any]:
        """Restore individual components"""
        results = {}

        # Restore database
        if 'database' in backup_info.get('components', {}):
            results['database'] = await self._restore_database(backup_dir)

        # Restore evidence
        if 'evidence' in backup_info.get('components', {}):
            results['evidence'] = await self._restore_evidence(backup_dir)

        # Restore config
        if 'config' in backup_info.get('components', {}):
            results['config'] = await self._restore_config(backup_dir)

        return results

    async def _restore_database(self, backup_dir: Path) -> Dict[str, Any]:
        """Restore database from backup"""
        backup_db = backup_dir / 'database.db'
        target_db = Path(self.config['database_path'])

        if backup_db.exists():
            # Create backup of current database
            if target_db.exists():
                backup_current = target_db.with_suffix('.backup')
                shutil.copy2(target_db, backup_current)

            # Restore from backup
            shutil.copy2(backup_db, target_db)

            return {
                'status': 'completed',
                'source': str(backup_db),
                'target': str(target_db),
                'size': target_db.stat().st_size
            }

        return {'status': 'skipped', 'reason': 'Database backup not found'}

    async def _restore_evidence(self, backup_dir: Path) -> Dict[str, Any]:
        """Restore evidence files from backup"""
        backup_evidence = backup_dir / 'evidence'
        target_evidence = Path(self.config['evidence_dir'])

        if backup_evidence.exists():
            # Create backup of current evidence
            if target_evidence.exists():
                backup_current = target_evidence.parent / f"{target_evidence.name}.backup"
                if backup_current.exists():
                    shutil.rmtree(backup_current)
                shutil.copytree(target_evidence, backup_current)

            # Restore from backup
            if target_evidence.exists():
                shutil.rmtree(target_evidence)
            shutil.copytree(backup_evidence, target_evidence)

            return {
                'status': 'completed',
                'source': str(backup_evidence),
                'target': str(target_evidence)
            }

        return {'status': 'skipped', 'reason': 'Evidence backup not found'}

    async def _restore_config(self, backup_dir: Path) -> Dict[str, Any]:
        """Restore configuration files from backup"""
        backup_config = backup_dir / 'config'

        if backup_config.exists():
            restored_files = []

            for config_file in backup_config.iterdir():
                if config_file.is_file():
                    target_file = Path(config_file.name)
                    if target_file.exists():
                        backup_file = target_file.with_suffix('.backup')
                        shutil.copy2(target_file, backup_file)

                    shutil.copy2(config_file, target_file)
                    restored_files.append(config_file.name)

            return {
                'status': 'completed',
                'files': restored_files
            }

        return {'status': 'skipped', 'reason': 'Config backup not found'}

    def get_backup_status(self) -> Dict[str, Any]:
        """Get current backup system status"""
        return {
            'is_backup_running': self.is_backup_running,
            'last_backup_time': self.last_backup_time.isoformat() if self.last_backup_time else None,
            'backup_stats': self.backup_stats,
            'recent_backups': self.backup_metadata['backups'][-5:] if self.backup_metadata['backups'] else [],
            'configuration': {
                'retention_days': self.config['retention_days'],
                'backup_schedule': self.config['backup_schedule'],
                'full_backup_interval_days': self.config['full_backup_interval_days'],
                'incremental_backup_enabled': self.config['incremental_backup_enabled']
            }
        }

    def get_available_backups(self) -> List[Dict[str, Any]]:
        """Get list of available backups"""
        return self.backup_metadata['backups']

    async def verify_backup_integrity(self, backup_id: str) -> Dict[str, Any]:
        """Verify integrity of a backup"""
        try:
            backup_info = None
            for backup in self.backup_metadata['backups']:
                if backup['id'] == backup_id:
                    backup_info = backup
                    break

            if not backup_info:
                return {'valid': False, 'error': 'Backup not found'}

            archive_path = Path(backup_info['archive_path'])
            if not archive_path.exists():
                return {'valid': False, 'error': 'Backup archive not found'}

            # Verify hash
            current_hash = await self._calculate_integrity_hash(archive_path)
            expected_hash = backup_info['integrity_hash']

            if current_hash != expected_hash:
                return {
                    'valid': False,
                    'error': 'Integrity check failed',
                    'expected_hash': expected_hash,
                    'actual_hash': current_hash
                }

            # Try to extract and verify contents
            try:
                with tarfile.open(archive_path, 'r:gz') as tar:
                    # Basic validation - check if we can read the archive
                    members = tar.getmembers()
                    if not members:
                        return {'valid': False, 'error': 'Archive is empty'}

            except Exception as e:
                return {'valid': False, 'error': f'Archive corrupted: {str(e)}'}

            return {
                'valid': True,
                'backup_id': backup_id,
                'size': archive_path.stat().st_size,
                'integrity_hash': current_hash
            }

        except Exception as e:
            return {'valid': False, 'error': str(e)}

    async def shutdown(self):
        """Shutdown backup manager"""
        logger.info("Shutting down Backup Manager...")

        # Wait for any running backup to complete
        while self.is_backup_running:
            await asyncio.sleep(1)

        # Shutdown thread pool
        self.executor.shutdown(wait=True)

        logger.info("Backup Manager shutdown complete")

# Global backup manager instance
backup_manager = None

async def get_backup_manager() -> BackupManager:
    """Get the global backup manager instance"""
    global backup_manager
    if backup_manager is None:
        # Load configuration from environment or defaults
        config = {
            'backup_dir': os.getenv('BACKUP_DIR', './data/backups'),
            'database_path': os.getenv('DATABASE_PATH', './data/fraud_detection.db'),
            'evidence_dir': os.getenv('EVIDENCE_DIR', './data/evidence'),
            'config_dir': os.getenv('CONFIG_DIR', './data/config'),
            'retention_days': int(os.getenv('BACKUP_RETENTION_DAYS', '30')),
            'max_backup_size_gb': int(os.getenv('MAX_BACKUP_SIZE_GB', '10')),
            'compression_level': int(os.getenv('BACKUP_COMPRESSION_LEVEL', '6')),
            'encryption_enabled': os.getenv('BACKUP_ENCRYPTION_ENABLED', 'true').lower() == 'true',
            'remote_backup_enabled': os.getenv('REMOTE_BACKUP_ENABLED', 'false').lower() == 'true',
            'remote_backup_url': os.getenv('REMOTE_BACKUP_URL', ''),
            'backup_schedule': os.getenv('BACKUP_SCHEDULE', '0 2 * * *'),
            'full_backup_interval_days': int(os.getenv('FULL_BACKUP_INTERVAL_DAYS', '7')),
            'incremental_backup_enabled': os.getenv('INCREMENTAL_BACKUP_ENABLED', 'true').lower() == 'true'
        }
        backup_manager = BackupManager(config)
    return backup_manager