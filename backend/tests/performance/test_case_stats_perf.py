"""
Performance test for case stats optimization
"""

import time
import pytest
import sys
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend is in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from core.models.base import Base
from core.models.case import Case
from app.services.business.case_service import case_service

@pytest.fixture(scope="function")
def perf_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db, engine
    db.close()

def test_get_case_stats_query_count(perf_db):
    db, engine = perf_db

    # Seed data
    cases = []
    for i in range(100):
        status = "open" if i % 2 == 0 else "closed"
        priority = "critical" if i % 5 == 0 else "medium"
        cases.append(Case(
            title=f"Case {i}",
            description="desc",
            status=status,
            priority=priority,
            project_id="default"
        ))
    db.add_all(cases)
    db.commit()

    # Measure queries
    # Use a mutable object to store count since nonlocal won't work easily in fixture/test mix sometimes
    metrics = {"count": 0}

    @event.listens_for(engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        metrics["count"] += 1

    start_time = time.time()
    stats = case_service.get_case_stats(db, project_id="default")
    end_time = time.time()

    print(f"\nTime taken: {end_time - start_time:.6f}s")
    print(f"Queries executed: {metrics['count']}")
    print(f"Stats: {stats}")

    # Check correctness
    assert stats["total_cases"] == 100
    assert stats["open_cases"] == 50
    assert stats["closed_cases"] == 50
    assert stats["critical_cases"] == 20

    return metrics["count"]

if __name__ == "__main__":
    # Manually run if executed directly
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    cases = []
    for i in range(100):
        status = "open" if i % 2 == 0 else "closed"
        priority = "critical" if i % 5 == 0 else "medium"
        cases.append(Case(
            title=f"Case {i}",
            description="desc",
            status=status,
            priority=priority,
            project_id="default"
        ))
    db.add_all(cases)
    db.commit()

    metrics = {"count": 0}
    @event.listens_for(engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        metrics["count"] += 1

    start_time = time.time()
    stats = case_service.get_case_stats(db, project_id="default")
    end_time = time.time()

    print(f"Time taken: {end_time - start_time:.6f}s")
    print(f"Queries executed: {metrics['count']}")
    print(f"Stats: {stats}")
