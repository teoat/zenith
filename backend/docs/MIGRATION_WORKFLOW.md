# Migration Workflow Documentation

## Schema Versioning with Alembic

### Current Schema Version: 1.0.0

### Creating Migrations

```bash
# Auto-generate migration from model changes
cd backend
alembic revision --autogenerate -m "Add new field to Case model"

# Create empty migration for manual changes
alembic revision -m "Custom schema change"
```

### Running Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade to specific revision
alembic upgrade abc123

# Show current version
alembic current

# Show migration history
alembic history
```

### Rolling Back Migrations

```bash
# Downgrade one revision
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade abc123

# Downgrade all (WARNING: destructive)
alembic downgrade base
```

### Version Stamping

```bash
# Mark database as being at a specific version (without running migrations)
alembic stamp head

# Mark as specific revision
alembic stamp abc123
```

### Migration Best Practices

1. **Always Review Auto-Generated Migrations**
   - Auto-generate creates a draft
   - Review and edit before applying
   - Test on development database first

2. **Write Reversible Migrations**
   - Always implement `downgrade()` function
   - Test rollback before deploying
   - Document breaking changes

3. **Data Migrations**
   - For data changes, use separate migration
   - Use `op.execute()` for bulk updates
   - Consider performance on large tables

4. **Schema Versioning**
   - Update SCHEMA_VERSION in env.py for breaking changes
   - Document version changes in migrations
   - Maintain changelog

### Example Migration

```python
# revisions/abc123_add_status_field.py
"""Add status field to cases

Revision ID: abc123
Revises: def456
Create Date: 2024-12-08

"""
from alembic import op
import sqlalchemy as sa

# Schema version this migration targets
TARGET_SCHEMA_VERSION = "1.0.0"

def upgrade():
    # Add new column
    op.add_column('cases', 
        sa.Column('status', sa.String(50), nullable=True)
    )
    
    # Set default value for existing rows
    op.execute("UPDATE cases SET status = 'open' WHERE status IS NULL")
    
    # Make column non-nullable
    op.alter_column('cases', 'status', nullable=False)

def downgrade():
    # Remove column
    op.drop_column('cases', 'status')
```

### Rollback Procedures

**Emergency Rollback:**
1. Identify target revision: `alembic history`
2. Create backup: `python scripts/backup_db.py backup --type emergency`
3. Roll back: `alembic downgrade <revision>`
4. Verify: `alembic current`
5. Test application

**Planned Rollback:**
1. Notify users of maintenance window
2. Create backup
3. Run rollback during low-traffic period
4. Verify functionality
5. Monitor for issues

### Version Checking

```python
# Check current database version
from backend.alembic.env import check_current_version

current = check_current_version()
print(f"Current revision: {current}")
```

### Migration Checklist

Before applying migrations to production:

- [ ] Migration tested on development database
- [ ] Upgrade path tested
- [ ] Downgrade path tested  
- [ ] Performance impact assessed
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Breaking changes communicated
- [ ] Schema version updated (if applicable)
