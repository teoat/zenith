# backend/services/database_optimizer.py
import logging
import time
from typing import Any

from sqlalchemy import desc, func, or_, text
from sqlalchemy.orm import selectinload

from core.database import (
    Case,
    SessionLocal,
    Transaction,
)

logger = logging.getLogger(__name__)


class DatabaseOptimizer:
    def __init__(self):
        self.query_cache = {}
        self.performance_metrics = []

    def get_optimized_session(self):
        """Get database session with optimized settings"""
        return SessionLocal()

    def execute_optimized_query(self, query, params=None):
        """Execute query with performance monitoring"""
        start_time = time.time()

        try:
            with self.get_optimized_session() as session:
                if params:
                    result = session.execute(text(query), params)
                else:
                    result = session.execute(text(query))

                execution_time = time.time() - start_time

                # Log slow queries
                if execution_time > 1.0:  # More than 1 second
                    logger.warning(
                        f"Slow query detected: {execution_time:.2f}s - {query[:100]}..."
                    )

                # Store performance metrics
                self.performance_metrics.append(
                    {
                        "query": query[:200],  # Truncate for storage
                        "execution_time": execution_time,
                        "timestamp": time.time(),
                        "params": str(params) if params else None,
                    }
                )

                # Keep only last 100 metrics
                if len(self.performance_metrics) > 100:
                    self.performance_metrics.pop(0)

                return result

        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise

    def get_paginated_cases(
        self, page: int = 1, per_page: int = 20, filters: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Get paginated cases with optimized queries"""
        start_time = time.time()

        with self.get_optimized_session() as session:
            query = session.query(Case)

            # Apply filters with indexed columns
            if filters:
                if "status" in filters:
                    query = query.filter(Case.status == filters["status"])
                if "priority" in filters:
                    query = query.filter(Case.priority == filters["priority"])
                if "assignee_id" in filters:
                    query = query.filter(Case.assignee_id == filters["assignee_id"])
                if "risk_level" in filters:
                    query = query.filter(Case.risk_level == filters["risk_level"])
                if "search" in filters:
                    search_term = f"%{filters['search']}%"
                    query = query.filter(
                        or_(
                            Case.title.ilike(search_term),
                            Case.description.ilike(search_term),
                            Case.customer_name.ilike(search_term),
                        )
                    )

            # Get total count efficiently
            total_count = query.count()

            # Apply pagination with optimized ordering
            cases = (
                query.order_by(desc(Case.created_at))
                .offset((page - 1) * per_page)
                .limit(per_page)
                .all()
            )

            execution_time = time.time() - start_time

            return {
                "cases": cases,
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page,
                "execution_time": execution_time,
            }

    def get_case_with_optimized_relationships(
        self, case_id: str
    ) -> dict[str, Any] | None:
        """Get case with optimized relationship loading"""
        start_time = time.time()

        with self.get_optimized_session() as session:
            # Use selectinload for efficient relationship loading
            case = (
                session.query(Case)
                .options(
                    selectinload(Case.transactions),
                    selectinload(Case.evidence),
                    selectinload(Case.notes),
                    selectinload(Case.activities),
                )
                .filter(Case.id == case_id)
                .first()
            )

            if not case:
                return None

            execution_time = time.time() - start_time

            return {"case": case, "execution_time": execution_time}

    def get_optimized_transaction_aggregates(
        self, case_id: str | None = None, date_from=None, date_to=None
    ) -> dict[str, Any]:
        """Get transaction aggregates with optimized queries"""
        start_time = time.time()

        with self.get_optimized_session() as session:
            query = session.query(
                func.count(Transaction.id).label("total_count"),
                func.sum(Transaction.amount).label("total_amount"),
                func.avg(Transaction.amount).label("avg_amount"),
                func.min(Transaction.amount).label("min_amount"),
                func.max(Transaction.amount).label("max_amount"),
                func.count(func.distinct(Transaction.merchant_name)).label(
                    "unique_merchants"
                ),
            )

            if case_id:
                query = query.filter(Transaction.case_id == case_id)

            if date_from:
                query = query.filter(Transaction.date >= date_from)
            if date_to:
                query = query.filter(Transaction.date <= date_to)

            result = query.first()

            execution_time = time.time() - start_time

            return {
                "aggregates": {
                    "total_count": result.total_count or 0,
                    "total_amount": float(result.total_amount or 0),
                    "avg_amount": float(result.avg_amount or 0),
                    "min_amount": float(result.min_amount or 0),
                    "max_amount": float(result.max_amount or 0),
                    "unique_merchants": result.unique_merchants or 0,
                },
                "execution_time": execution_time,
            }

    def get_performance_metrics(self) -> dict[str, Any]:
        """Get database performance metrics"""
        return {
            "query_metrics": self.performance_metrics[-20:],  # Last 20 queries
            "slow_queries": [
                m for m in self.performance_metrics if m["execution_time"] > 1.0
            ],
            "avg_query_time": (
                sum(m["execution_time"] for m in self.performance_metrics)
                / len(self.performance_metrics)
                if self.performance_metrics
                else 0
            ),
            "total_queries": len(self.performance_metrics),
        }

    def optimize_query_with_explain(self, query, params=None) -> dict[str, Any]:
        """Analyze query performance with EXPLAIN"""
        try:
            explain_query = f"EXPLAIN QUERY PLAN {query}"
            result = self.execute_optimized_query(explain_query, params)

            plan = result.fetchall()

            return {
                "query_plan": [dict(row) for row in plan],
                "optimization_suggestions": self._analyze_query_plan(plan),
            }
        except Exception as e:
            logger.error(f"Query analysis failed: {e}")
            return {"error": str(e)}

    def _analyze_query_plan(self, plan) -> list[str]:
        """Analyze query execution plan and provide optimization suggestions"""
        suggestions = []

        for step in plan:
            detail = step.get("detail", "").lower()

            # Check for table scans (inefficient)
            if "scan" in detail and "index" not in detail:
                suggestions.append(
                    "Consider adding indexes for better query performance"
                )

            # Check for temporary sorts
            if "order by" in detail or "sort" in detail:
                suggestions.append("Query requires sorting - consider indexed ordering")

            # Check for nested loops (can be inefficient)
            if "nested loop" in detail:
                suggestions.append(
                    "Nested loop detected - consider query restructuring"
                )

        if not suggestions:
            suggestions.append("Query plan looks optimized")

        return list(set(suggestions))  # Remove duplicates

    def create_performance_indexes(self):
        """Create additional performance indexes if needed"""
        indexes_to_create = [
            "CREATE INDEX IF NOT EXISTS idx_case_search ON cases(title, description, customer_name);",
            "CREATE INDEX IF NOT EXISTS idx_transaction_composite ON transactions(case_id, date, amount);",
            "CREATE INDEX IF NOT EXISTS idx_evidence_processing ON evidence(processing_status, uploaded_at);",
            "CREATE INDEX IF NOT EXISTS idx_case_activity_audit ON case_activities(case_id, timestamp, activity_type);",
        ]

        for index_sql in indexes_to_create:
            try:
                self.execute_optimized_query(index_sql)
                logger.info(f"Created index: {index_sql}")
            except Exception as e:
                logger.warning(f"Failed to create index: {e}")

    def get_database_stats(self) -> dict[str, Any]:
        """Get comprehensive database statistics"""
        stats = {}

        # Whitelist of allowed tables to prevent SQL injection
        allowed_tables = {
            "cases",
            "evidence",
            "transactions",
            "case_activities",
            "case_notes",
            "fraud_alerts",
            "users",
            "audit_logs",
        }

        try:
            # Table sizes
            table_stats = self.execute_optimized_query(
                """
                SELECT name, sql FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%';
            """
            )

            for row in table_stats:
                table_name = row.name
                # Validate table name against whitelist
                if table_name not in allowed_tables:
                    logger.warning(f"Skipping unknown table: {table_name}")
                    continue

                count_result = self.execute_optimized_query(
                    "SELECT COUNT(*) as count FROM ?;", (table_name,)
                )
                count = count_result.fetchone()[0]

                stats[table_name] = {
                    "row_count": count,
                    "estimated_size_mb": (count * 0.001),  # Rough estimate
                }

        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            stats["error"] = str(e)

        return stats


# Create singleton instance
db_optimizer = DatabaseOptimizer()
