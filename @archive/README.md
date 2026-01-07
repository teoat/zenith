# Archive Centralization

Created: January 7, 2026

This directory (`@archive/`) contains centralized archival materials from the project root. It serves as a single location for inactive, duplicate, or historical files to keep the main repository clean.

## Organization Structure

- **backup_folders/**: Consolidated backup directories (e.g., `test_backups`, `diagnostics_archive`).
- **configs/**: Backup configuration files (e.g., old `.env` backups, docker ignore backups).
- **database_backups/**: Database dump files and test databases.
- **diagnostics/**: Placeholder for future diagnostic reports.
- **docker/**: Old or alternative Dockerfile versions.
- **duplicates/**: Duplicate files found in the root (often with " 2" or " 3" suffix).
- **legacy_archive/**: Previous archive folder (consolidated).
- **logs/**: Placeholder for consolidated log files.
- **releases/**: Old release builds (DMG, ZIP).
- **reports/**: Status reports, phase completion reports, and other documentation snapshots.
- **scripts/**: Utility scripts (Python/JS) that are no longer in active main use or are backups of active scripts.
- **test_backups/**: Specific test backup files.
- **test_outputs/**: Raw text/JSON output from test runs.
- **test_results/**: HTML coverage reports, test result directories.

## Retention Policy

1. **Duplicate Files (`duplicates/`)**: Can be deleted after confirming no data loss. Review if unsure.
2. **Test Results (`test_results/`, `test_outputs/`)**: Keep for historical comparison if needed, otherwise safe to delete older than 30 days.
3. **Reports (`reports/`)**: Keep permanently as project history.
4. **Database Backups (`database_backups/`)**: Keep critical checkpoints. Delete intermediate test dumps.
5. **Scripts (`scripts/`)**: Keep as reference repository for useful snippets.
6. **Backups (`backup_folders/`)**: Review content. If merged into main codebase, can be deleted.

## Usage

Do not carry out active development in this folder. Restore files to the root directory if they need to be reactivated.
