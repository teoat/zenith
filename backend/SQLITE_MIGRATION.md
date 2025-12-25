# Backend Database Documentation - SQLite/SQLCipher Migration

**Last Updated**: December 8, 2024  
**Architecture**: Electron desktop app with SQLite/SQLCipher database  
**Migration Status**: Documentation complete, code migration pending

---

## Overview

The backend was originally designed for **PostgreSQL** (server-based deployment) but is now migrating to **SQLite with SQLCipher encryption** for the Electron desktop application.

**Current State**: SQLAlchemy ORM code is database-agnostic and works with both PostgreSQL and SQLite with minimal changes.

---

## Database Configuration Changes

### Before (PostgreSQL - Web App)

```python
# backend/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/frauddb")

engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_recycle=3600
)
```

### After (SQLCipher - Electron Desktop)

```python
# backend/core/database.py
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# Local app data directory
APP_DATA_DIR = Path.home() / ".Zenith"
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = APP_DATA_DIR / "frauddb.db"
ENCRYPTION_KEY = os.getenv("SQLCIPHER_KEY")  # Retrieved from OS keychain via Electron

# SQLite connection string
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Allow multi-threaded access
    pool_pre_ping=True  # Verify connections before using
)

# Enable SQLCipher encryption
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute(f"PRAGMA key = '{ENCRYPTION_KEY}'")
    cursor.execute("PRAGMA cipher_page_size = 4096")
    cursor.execute("PRAGMA kdf_iter = 256000")
    cursor.close()
```

---

## SQLAlchemy Model Compatibility

**Good News**: Most SQLAlchemy models work unchanged! 

### Models That Work As-Is

```python
# backend/app/models/case.py
from sqlalchemy import Column, Integer, String, DateTime, DECIMAL
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, autoincrement=True)  # ✅ Works in SQLite
    title = Column(String(255), nullable=False)                 # ✅ Works in SQLite
    description = Column(Text)                                   # ✅ Works in SQLite
    created_at = Column(DateTime, server_default=func.now())     # ✅ Works in SQLite
    risk_score = Column(DECIMAL(5, 2))                           # ✅ Works in SQLite
```

### Changes Needed

**1. Remove PostgreSQL-Specific Types**

```python
# BEFORE (PostgreSQL-specific)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

class Evidence(Base):
    metadata_json = Column(JSONB)  # ❌ PostgreSQL-only
    tags = Column(ARRAY(String))    # ❌ PostgreSQL-only

# AFTER (SQLite-compatible)
from sqlalchemy import Column, Text
import json

class Evidence(Base):
    metadata_json = Column(Text)  # ✅ Store JSON as text, parse in Python
    tags = Column(Text)            # ✅ Store as comma-separated or JSON array
    
    @property
    def metadata(self):
        return json.loads(self.metadata_json) if self.metadata_json else {}
    
    @metadata.setter
    def metadata(self, value):
        self.metadata_json = json.dumps(value)
```

**2. Remove pgvector Dependency**

```python
# BEFORE (PostgreSQL pgvector extension)
from pgvector.sqlalchemy import Vector

class Document(Base):
    embedding = Column(Vector(1536))  # ❌ Requires pgvector extension

# AFTER (SQLite-compatible)
import numpy as np

class Document(Base):
    embedding_blob = Column(LargeBinary)  # ✅ Store as binary blob
    
    @property
    def embedding(self):
        return np.frombuffer(self.embedding_blob, dtype=np.float32)
    
    @embedding.setter
    def embedding(self, value):
        self.embedding_blob = np.array(value, dtype=np.float32).tobytes()
```

**3. Full-Text Search**

```python
# BEFORE (PostgreSQL full-text search)
from sqlalchemy import func

query = session.query(Case).filter(
    func.to_tsvector('english', Case.description).match('fraud')
)

# AFTER (SQLite FTS5)
# Create FTS5 virtual table
CREATE VIRTUAL TABLE cases_fts USING fts5(title, description);

# Query in SQLAlchemy
from sqlalchemy import text

query = session.execute(
    text("SELECT * FROM cases_fts WHERE cases_fts MATCH :search_term"),
    {"search_term": "fraud"}
)
```

---

## Redis Caching (Made Optional)

**Before**: Redis was required for all caching  
**After**: Redis is optional, in-memory cache used by default

```python
# backend/core/cache.py
import os
from typing  import Optional
import redis

# Redis connection (optional for future cloud sync)
REDIS_ENABLED = os.getenv("REDIS_ENABLED", "false").lower() == "true"

if REDIS_ENABLED:
    redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
else:
    redis_client = None  # Use in-memory cache instead

class CacheManager:
    def __init__(self):
        self.local_cache = {}  # In-memory cache (always available)
        self.redis = redis_client  # Optional Redis cache
    
    async def get(self, key: str):
        # Try Redis first if available
        if self.redis:
            try:
                cached = await self.redis.get(key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Redis unavailable: {e}")
        
        # Fall back to local cache
        return self.local_cache.get(key)
    
    async def set(self, key: str, value, ttl: int = 3600):
        # Store in Redis if available
        if self.redis:
            try:
                await self.redis.setex(key, ttl, json.dumps(value))
            except Exception:
                pass  # Silent failure, use local cache only
        
        # Always store in local cache
        self.local_cache[key] = value
```

---

## Migration Checklist

### Phase 1: Database Adapter (Not Started)
- [ ] Update `backend/core/database.py` for SQLite/SQLCipher
- [ ] Add SQLCipher encryption pragma
- [ ] Test database connection
- [ ] Update connection string format

### Phase 2: Model Updates (Not Started)
- [ ] Replace `JSONB` → `Text` + JSON parsing
- [ ] Replace `ARRAY` → `Text` + comma-separated
- [ ] Remove `pgvector.Vector` → `LargeBinary` + NumPy
- [ ] Update any PostgreSQL-specific SQL queries

### Phase 3: Alembic Migrations (Not Started)
- [ ] Review existing Alembic migrations for PostgreSQL-specific syntax
- [ ] Test migrations against SQLite
- [ ] Create new migration for initial SQLite schema

### Phase 4: Testing (Not Started)
- [ ] Update tests to use SQLite test database
- [ ] Remove PostgreSQL Docker container from tests
- [ ] Test all CRUD operations
- [ ] Test full-text search (FTS5)
- [ ] Test vector search fallback

### Phase 5: Cache Refactoring (Partial)
- [x] Made Redis optional in `requirements.txt`
- [ ] Update services to gracefully handle missing Redis
- [ ] Implement in-memory cache fallback
- [ ] Test offline functionality

---

## Testing Guide

### Local SQLite Testing

```bash
cd backend

# Create test database
python scripts/init_db.py --test

# Run tests with SQLite
export DATABASE_URL="sqlite:///./test.db"
pytest tests/ -v

# Inspect database
sqlite3 ~/.Zenith/frauddb.db
```

### SQLCipher Encryption Testing

```bash
# Install SQLCipher
brew install sqlcipher  # macOS
apt-get install sqlcipher3  # Linux

# Test encrypted database
sqlcipher ~/.Zenith/frauddb.db
SQLCipher version 4.5.0
Enter password: <your-encryption-key>
sqlite> SELECT * FROM cases LIMIT 5;
```

---

## Performance Considerations

### SQLite vs PostgreSQL

| Feature | PostgreSQL (Web) | SQLite (Desktop) |
|---------|------------------|------------------|
| **Concurrency** | Excellent (multi-user) | Good (single-user) |
| **Write Speed** | Fast | Very fast (no network) |
| **Read Speed** | Fast | Very fast (no network latency) |
| **Full-Text Search** | Built-in (`tsvector`) | FTS5 extension (excellent) |
| **JSON Support** | Native (`JSONB`) | Text storage + parsing |
| **Vector Search** | pgvector extension | Custom implementation needed |
| **Max Database Size** | Unlimited | 140 TB (more than enough) |

**Verdict**: SQLite is perfect for single-user desktop apps. Even with 100,000+ cases, performance will be excellent.

---

## Rollback Plan

If migration issues arise, the backend can still work with PostgreSQL by:
1. Reverting `DATABASE_URL` to PostgreSQL
2. Re-installing `pgvector` in `requirements.txt`
3. Using original model definitions

**However**, this defeats the purpose of the Electron desktop app (would require users to run their own PostgreSQL server).

---

## Next Steps

1. **Immediate**: Update `backend/core/database.py` for SQLite
2. **Short-term**: Test all models with SQLite
3. **Medium-term**: Implement SQLCipher encryption
4. **Long-term**: Migrate all PostgreSQL-specific queries

**Estimated Effort**: 4-8 hours of development + testing

---

**Status**: 📝 Documentation complete, implementation pending  
**Blocker**: None (SQLAlchemy already supports SQLite)  
**Risk**: Low (straightforward migration)
