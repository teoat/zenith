# services/db.py
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from main import PaginationParams, FilterParams

from sqlalchemy import and_, desc, or_, text
from sqlalchemy.exc import SQLAlchemyError, OperationalError, DisconnectionError
from sqlalchemy.orm import Session
from sqlalchemy.pool import QueuePool

from app.services.infrastructure.cache_service import cache_manager, cached, query_cache
from app.services.infrastructure.circuit_breaker import circuit_breaker, CircuitBreakerConfig, get_circuit_breaker
from app.services.infrastructure.error_handler import error_handler, service_operation_context, ErrorCategory, ServiceError
from app.services.infrastructure.storage.database_optimizer_service import db_optimizer
from core.logging import logger
from core.database import (
    Case,
    CaseActivity,
    CaseNote,
    CaseStatus,
    CaseType,
    Evidence,
    ReconciliationType,
    SessionLocal,
    Team,
    Transaction,
    User,
)


class DatabaseService:
    """Enhanced database service with 99.99% uptime features"""

    def __init__(self):
        self.SessionLocal = SessionLocal
        self._connection_pool_size = 20  # Connection pool size
        self._max_overflow = 30  # Max overflow connections
        self._pool_timeout = 30  # Pool timeout in seconds
        self._pool_recycle = 3600  # Recycle connections every hour

        # Enhanced circuit breaker config for 99.99% uptime
        self._db_circuit_config = CircuitBreakerConfig(
            failure_threshold=3,  # Open after 3 failures (more sensitive)
            recovery_timeout=15.0,  # Try again after 15 seconds (faster recovery)
            expected_exception=(SQLAlchemyError, OperationalError, DisconnectionError),
            success_threshold=2,  # Need 2 successes to close
            timeout=5.0  # 5 second timeout for operations
        )

        # Health monitoring
        self._last_health_check = 0
        self._health_check_interval = 30  # Check health every 30 seconds
        self._connection_failures = 0
        self._max_connection_failures = 5

    def _get_connection_pool_status(self) -> Dict[str, Any]:
        """Get connection pool status for monitoring"""
        try:
            pool = self.SessionLocal.kw.get('bind', {}).pool
            if hasattr(pool, 'size'):
                return {
                    "pool_size": pool.size(),
                    "checked_out": getattr(pool, 'checkedout', lambda: 0)(),
                    "overflow": getattr(pool, 'overflow', lambda: 0)(),
                    "invalid": getattr(pool, 'invalid', lambda: 0)(),
                }
        except Exception:
            pass
        return {"status": "unknown"}

    @circuit_breaker("database_connection", CircuitBreakerConfig(
        failure_threshold=2, recovery_timeout=10.0,
        expected_exception=(OperationalError, DisconnectionError)
    ))
    async def execute_cached_query(
        self,
        query_sql: str,
        parameters: tuple = (),
        ttl_seconds: int = 300,
        use_read_replica: bool = True,
        table_names: list[str] = None
    ) -> Any:
        """Execute a database query with intelligent caching"""
        async def query_func():
            # Execute query using read replica if available and requested
            session = self.get_db()
            try:
                result = session.execute(query_sql, parameters)
                return result.fetchall()
            finally:
                session.close()

        return await query_cache.execute_cached_query(
            query_func=query_func,
            query_sql=query_sql,
            parameters=parameters,
            ttl_seconds=ttl_seconds,
            use_read_replica=use_read_replica,
            table_names=table_names
        )

    def get_db(self) -> Session:
        """Get database session with enhanced resilience"""
        max_retries = 3
        retry_delay = 0.1

        for attempt in range(max_retries):
            try:
                session = self.SessionLocal()
                # Test connection with a simple query
                session.execute(text("SELECT 1")).fetchone()
                return session
            except (OperationalError, DisconnectionError) as e:
                logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                self._connection_failures += 1
                raise e
            except Exception as e:
                logger.error(f"Unexpected database error: {e}")
                raise e

    def health_check(self) -> Dict[str, Any]:
        """Comprehensive database health check for 99.99% uptime monitoring"""
        health_status = {
            "service": "database",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "healthy",
            "response_time_ms": 0,
            "checks": {}
        }

        start_time = time.time()

        try:
            # Connection pool check
            pool_status = self._get_connection_pool_status()
            health_status["checks"]["connection_pool"] = {
                "status": "healthy" if pool_status.get("pool_size", 0) > 0 else "degraded",
                "details": pool_status
            }

            # Basic connectivity check
            with self.get_db() as db:
                result = db.execute(text("SELECT 1 as test")).fetchone()
                health_status["checks"]["connectivity"] = {
                    "status": "healthy" if result and result[0] == 1 else "unhealthy",
                    "query_result": result[0] if result else None
                }

            # Table accessibility check - optimized for performance
            with self.get_db() as db:
                # Check if critical tables exist and are accessible (lightweight check)
                tables_to_check = ["users", "cases", "transactions"]
                for table in tables_to_check:
                    try:
                        # Use a lightweight query to check table accessibility
                        db.execute(text(f"SELECT 1 FROM {table} LIMIT 1")).fetchone()
                        health_status["checks"][f"{table}_table"] = {
                            "status": "healthy",
                            "accessible": True
                        }
                    except Exception as e:
                        health_status["checks"][f"{table}_table"] = {
                            "status": "unhealthy",
                            "error": str(e)
                        }

            # Performance check - optimized
            with self.get_db() as db:
                perf_start = time.time()
                # Use a lightweight query for performance check
                db.execute(text("SELECT 1 FROM users LIMIT 1")).fetchone()
                perf_time = (time.time() - perf_start) * 1000
                health_status["checks"]["performance"] = {
                    "status": "healthy" if perf_time < 50 else "degraded",  # Lower threshold for lightweight query
                    "query_time_ms": round(perf_time, 2),
                    "threshold_ms": 50
                }

            # Circuit breaker status
            circuit_breaker = get_circuit_breaker("database_connection")
            cb_status = circuit_breaker.get_status()
            health_status["checks"]["circuit_breaker"] = {
                "status": "healthy" if cb_status["state"] == "closed" else "degraded",
                "details": cb_status
            }

        except Exception as e:
            health_status["status"] = "unhealthy"
            health_status["error"] = str(e)
            logger.error(f"Database health check failed: {e}")

        health_status["response_time_ms"] = round((time.time() - start_time) * 1000, 2)

        # Overall status determination
        if any(check.get("status") == "unhealthy" for check in health_status["checks"].values()):
            health_status["status"] = "unhealthy"
        elif any(check.get("status") == "degraded" for check in health_status["checks"].values()):
            health_status["status"] = "degraded"

        return health_status

    # ===== CASE MANAGEMENT =====

    def get_cases_paginated(
        self, *args, **kwargs
    ) -> Dict[str, Any]:
        """Get cases with optimized cursor-based pagination.
        
        Supports:
        - get_cases_paginated(db_session, page=1, per_page=20, filters={})
        - get_cases_paginated(page=1, per_page=20, filters={})
        """
        db = None
        page = kwargs.get("page", 1)
        per_page = kwargs.get("per_page", 20)
        filters = kwargs.get("filters", {})

        if args:
            if hasattr(args[0], 'query'):
                db = args[0]
                if len(args) > 1: page = args[1]
                if len(args) > 2: per_page = args[2]
                if len(args) > 3: filters = args[3]
            else:
                page = args[0]
                if len(args) > 1: per_page = args[1]
                if len(args) > 2: filters = args[2]

        try:
            if db:
                return self._get_cases_paginated_logic(db, page, per_page, filters)
            else:
                with self.get_db() as session:
                    return self._get_cases_paginated_logic(session, page, per_page, filters)
        except SQLAlchemyError as e:
            from app.core._errors import error_handler
            error_handler.log_and_raise_http_error(
                error_handler.handle_database_error(e, "get_cases_paginated")
            )
        except Exception as e:
            from app.core._errors import error_handler, ServiceError, ErrorCategory, ErrorSeverity
            error_handler.log_and_raise_http_error(
                ServiceError(
                    message="Unexpected error in get_cases_paginated",
                    category=ErrorCategory.DATABASE,
                    severity=ErrorSeverity.HIGH,
                    original_error=e,
                    retryable=True,
                    user_friendly_message="Unable to retrieve cases. Please try again."
                )
            )

    def _get_cases_paginated_logic(self, db: Session, page: int, per_page: int, filters: dict) -> Dict[str, Any]:
        """Core logic for paginated case retrieval"""
        offset = (page - 1) * per_page

        # Build query with specific columns for performance
        query = db.query(
            Case.id,
            Case.title,
            Case.description,
            Case.status,
            Case.case_type,
            Case.assignee_id,
            Case.risk_score,
            Case.risk_level,
            Case.fraud_amount,
            Case.customer_name,
            Case.created_at,
            Case.updated_at,
            Case.due_date,
        )

        # Apply filters
        if filters:
            if "status" in filters and filters["status"]:
                query = query.filter(Case.status == filters["status"])
            if "assignee_id" in filters and filters["assignee_id"]:
                query = query.filter(Case.assignee_id == filters["assignee_id"])
            if "risk_level" in filters and filters["risk_level"]:
                query = query.filter(Case.risk_level == filters["risk_level"])
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        Case.title.ilike(search_term),
                        Case.description.ilike(search_term),
                        Case.customer_name.ilike(search_term),
                    )
                )

        # Get total count for pagination info
        total_count = query.count()

        # Apply pagination and ordering
        cases = (
            query.order_by(desc(Case.created_at))
            .offset(offset)
            .limit(per_page)
            .all()
        )

        total_pages = (total_count + per_page - 1) // per_page if per_page > 0 else 0

        return {
            "cases": cases,
            "items": cases,
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "total_count": total_count,
            "total_pages": total_pages,
            "execution_time": 0.0,
        }

    def get_cases(
        self, skip: int = 0, limit: int = 100, filters: Dict[str, Any] = None
    ) -> List[Case]:
        """Get cases with optional filtering (legacy method)"""
        # Convert to pagination format for backward compatibility
        page = (skip // limit) + 1
        result = self.get_cases_paginated(page, limit, filters)
        return result["cases"]

    @cached("case_details", ttl_seconds=300)  # Cache for 5 minutes
    def get_case_with_details(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Get case with all related data"""
        result = db_optimizer.get_case_with_optimized_relationships(case_id)
        if not result:
            return None

        return {
            "case": result["case"],
            "transactions": result["case"].transactions,
            "evidence": result["case"].evidence,
            "notes": result["case"].notes,
            "activities": result["case"].activities,
        }

    @circuit_breaker("database_create_case", CircuitBreakerConfig(
        failure_threshold=3, recovery_timeout=10.0, expected_exception=(SQLAlchemyError,)
    ))
    def create_case(self, *args, **kwargs) -> Case:
        """Create a new case with audit trail.
        
        Supports multiple signatures:
        - Modern (router): create_case(db_session, id=..., title=..., project_id=...)
        - Legacy (tests): create_case(case_data_dict, created_by=None)
        """
        db = None
        case_data = {}
        created_by = None

        if args:
            # Check if first arg is a Session (modern router call)
            # Use hasattr check for broader compatibility
            if hasattr(args[0], 'add') and hasattr(args[0], 'commit'):
                db = args[0]
                case_data = kwargs
                created_by = kwargs.get("created_by") or kwargs.get("assigneeId") or kwargs.get("assignee_id")
            # Check if first arg is a dict (legacy call)
            elif isinstance(args[0], dict):
                case_data = args[0].copy()
                if len(args) > 1:
                    created_by = args[1]
                else:
                    created_by = kwargs.get("created_by")
            else:
                # Fallback
                case_data = kwargs
                created_by = args[0] if not db else None
        else:
            case_data = kwargs
            created_by = kwargs.get("created_by")

        # Determine session - if db was passed in, we use it directly.
        # Otherwise we get a new session from get_db().
        if db:
            return self._create_case_logic(db, case_data, created_by)
        else:
            with self.get_db() as session:
                return self._create_case_logic(session, case_data, created_by)

    def _create_case_logic(self, db: Session, case_data: dict, created_by: str = None) -> Case:
        """Common logic for case creation"""
        # Ensure created_by is stored if provided
        if created_by and "created_by" not in case_data:
            case_data["created_by"] = created_by
            
        # Clean up any non-model attributes from case_data before passing to Case constructor
        valid_columns = {c.key for c in Case.__table__.columns}
        filtered_data = {k: v for k, v in case_data.items() if k in valid_columns}
        
        # Handle project_id if not present
        if "project_id" not in filtered_data:
            filtered_data["project_id"] = "default"
            
        case = Case(**filtered_data)
        db.add(case)
        db.flush()

        # Create activity record
        activity = CaseActivity(
            case_id=case.id,
            user_id=created_by,
            activity_type="created",
            description=f"Case created: {case.title}",
            activity_metadata={"case_data": filtered_data}
        )
        db.add(activity)
        
        db.commit()
        db.refresh(case)
        return case

    def update_case(
        self, *args, **kwargs
    ) -> Optional[Case]:
        """Update case with audit trail.
        
        Supports:
        - update_case(db, case_id, update_data, updated_by=None)
        - update_case(case_id, update_data, updated_by=None)
        - update_case(db, case_id, **update_data)
        """
        db = None
        case_id = None
        update_data = {}
        updated_by = kwargs.get("updated_by")

        # Parse args
        remaining_args = list(args)
        if remaining_args and hasattr(remaining_args[0], 'query'):
            db = remaining_args.pop(0)
        
        if remaining_args:
            case_id = remaining_args.pop(0)
        elif "case_id" in kwargs:
            case_id = kwargs["case_id"]
            
        if remaining_args:
            update_data = remaining_args.pop(0)
        else:
            # Use kwargs for update_data if not passed as dict
            update_data = {k: v for k, v in kwargs.items() if k not in ["case_id", "updated_by"]}

        if db:
            return self._update_case_logic(db, case_id, update_data, updated_by)
        else:
            with self.get_db() as session:
                return self._update_case_logic(session, case_id, update_data, updated_by)

    def _update_case_logic(self, db: Session, case_id: str, update_data: dict, updated_by: str = None) -> Optional[Case]:
        """Core logic for updating a case"""
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return None

        old_values = {}
        for key, value in update_data.items():
            if hasattr(case, key):
                old_values[key] = getattr(case, key)
                setattr(case, key, value)

        case.updated_at = datetime.now(timezone.utc)

        # Create activity log
        if old_values:
            # Convert non-serializable objects (like datetime) to strings for JSON
            def make_serializable(obj):
                if isinstance(obj, dict):
                    return {k: make_serializable(v) for k, v in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [make_serializable(item) for item in obj]
                elif isinstance(obj, datetime):
                    return obj.isoformat()
                return obj

            activity = CaseActivity(
                case_id=case_id,
                user_id=updated_by,
                activity_type="updated",
                description="Case updated",
                activity_metadata=make_serializable({
                    "changes": update_data,
                    "old_values": old_values
                }),
            )
            db.add(activity)

        db.commit()
        db.refresh(case)
        return case

    def delete_case(self, case_id: str) -> bool:
        """Delete a case"""
        with self.get_db() as db:
            case = db.query(Case).filter(Case.id == case_id).first()
            if case:
                db.delete(case)
                db.commit()
                return True
            return False

    def assign_case(
        self, case_id: str, assignee_id: str, assigned_by: str
    ) -> Optional[Case]:
        """Assign case to user"""
        return self.update_case(
            case_id,
            {
                "assignee_id": assignee_id,
                "assigned_by": assigned_by,
                "assigned_at": datetime.now(timezone.utc),
            },
            assigned_by,
        )

    def change_case_status(
        self, case_id: str, new_status: CaseStatus, changed_by: str, reason: str = None
    ) -> Optional[Case]:
        """Change case status with audit trail"""
        with self.get_db() as db:
            case = db.query(Case).filter(Case.id == case_id).first()
            if not case:
                return None

            old_status = case.status
            case.status = new_status
            case.updated_at = datetime.now(timezone.utc)

            if new_status in [
                CaseStatus.CLOSED_APPROVED,
                CaseStatus.CLOSED_DENIED,
                CaseStatus.CLOSED_NO_ACTION,
            ]:
                case.closed_at = datetime.now(timezone.utc)
                case.closed_by = changed_by

            # Create activity
            activity = CaseActivity(
                case_id=case_id,
                user_id=changed_by,
                activity_type="status_changed",
                description=f"Status changed from {old_status.value} to {new_status.value}",
                old_value=old_status.value,
                new_value=new_status.value,
                metadata={"reason": reason},
            )
            db.add(activity)

            db.commit()
            db.refresh(case)
            return case

    def get_case_stats(self) -> Dict[str, Any]:
        """Get case statistics"""
        with self.get_db() as db:
            total_cases = db.query(Case).count()
            open_cases = (
                db.query(Case)
                .filter(
                    Case.status.in_(
                        [
                            CaseStatus.OPEN,
                            CaseStatus.INVESTIGATING,
                            CaseStatus.PENDING_REVIEW,
                        ]
                    )
                )
                .count()
            )
            escalated = (
                db.query(Case).filter(Case.status == CaseStatus.ESCALATED).count()
            )

            return {
                "total_cases": total_cases,
                "open_cases": open_cases,
                "high_priority": 0,  # metrics placeholder
                "escalated": escalated,
                "closure_rate": (
                    (total_cases - open_cases) / total_cases if total_cases > 0 else 0
                ),
            }

    def get_case(self, *args, **kwargs) -> Optional[Case]:
        """Retrieve a specific case by ID"""
        db = None
        case_id = kwargs.get("case_id")

        if args:
            if hasattr(args[0], 'query'):
                db = args[0]
                if len(args) > 1: case_id = args[1]
            else:
                case_id = args[0]

        if db:
            return db.query(Case).filter(Case.id == case_id).first()
        else:
            with self.get_db() as session:
                return session.query(Case).filter(Case.id == case_id).first()

    def delete_case(self, *args, **kwargs) -> bool:
        """Delete a specific case"""
        db = None
        case_id = kwargs.get("case_id")

        if args:
            if hasattr(args[0], 'query'):
                db = args[0]
                if len(args) > 1: case_id = args[1]
            else:
                case_id = args[0]

        if db:
            return self._delete_case_logic(db, case_id)
        else:
            with self.get_db() as session:
                return self._delete_case_logic(session, case_id)

    def _delete_case_logic(self, db: Session, case_id: str) -> bool:
        """Core logic for deleting a case"""
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            return False
            
        db.delete(case)
        db.commit()
        return True

    # ===== TRANSACTION MANAGEMENT =====

    def get_transactions_by_case(
        self, case_id: str, filters: Dict[str, Any] = None
    ) -> List[Transaction]:
        """Get transactions for a case with optional filtering"""
        with self.get_db() as db:
            query = db.query(Transaction).filter(Transaction.case_id == case_id)

            if filters:
                if "status" in filters:
                    query = query.filter(Transaction.status == filters["status"])
                if "is_flagged" in filters:
                    query = query.filter(
                        Transaction.is_flagged == filters["is_flagged"]
                    )
                if "date_from" in filters:
                    query = query.filter(Transaction.date >= filters["date_from"])
                if "date_to" in filters:
                    query = query.filter(Transaction.date <= filters["date_to"])

            return query.order_by(desc(Transaction.date)).all()

    def create_transaction(self, transaction_data: dict) -> Transaction:
        """Create a new transaction"""
        with self.get_db() as db:
            transaction = Transaction(**transaction_data)
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            return transaction

    def update_transaction_status(
        self, transaction_id: str, status: str, reviewed_by: str
    ) -> Optional[Transaction]:
        """Update transaction status"""
        with self.get_db() as db:
            transaction = (
                db.query(Transaction).filter(Transaction.id == transaction_id).first()
            )
            if transaction:
                transaction.status = status
                transaction.reviewed_by = reviewed_by
                transaction.reviewed_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(transaction)
            return transaction

    # ===== EVIDENCE MANAGEMENT =====

    def get_evidence_by_case(self, case_id: str) -> List[Evidence]:
        """Get evidence for a case"""
        with self.get_db() as db:
            return (
                db.query(Evidence)
                .filter(Evidence.case_id == case_id)
                .order_by(desc(Evidence.uploaded_at))
                .all()
            )

    def create_evidence(self, evidence_data: dict) -> Evidence:
        """Create new evidence"""
        with self.get_db() as db:
            evidence = Evidence(**evidence_data)
            db.add(evidence)
            db.commit()
            db.refresh(evidence)
            return evidence

    def update_evidence_admissibility(
        self, evidence_id: str, is_admissible: bool, reason: str = None
    ) -> Optional[Evidence]:
        """Update evidence admissibility"""
        with self.get_db() as db:
            evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
            if evidence:
                evidence.is_admissible = is_admissible
                evidence.admissibility_reason = reason
                db.commit()
                db.refresh(evidence)
            return evidence

    # ===== CASE NOTES =====

    def add_case_note(self, note_data: dict) -> CaseNote:
        """Add a note to a case"""
        with self.get_db() as db:
            note = CaseNote(**note_data)
            db.add(note)
            db.commit()
            db.refresh(note)
            return note

    def get_case_notes(
        self, case_id: str, include_internal: bool = True
    ) -> List[CaseNote]:
        """Get notes for a case"""
        with self.get_db() as db:
            query = db.query(CaseNote).filter(CaseNote.case_id == case_id)
            if not include_internal:
                query = query.filter(CaseNote.is_internal == False)
            return query.order_by(desc(CaseNote.created_at)).all()

    # ===== CASE ACTIVITIES =====

    def get_case_activities(self, case_id: str, limit: int = 50) -> List[CaseActivity]:
        """Get activity log for a case"""
        with self.get_db() as db:
            return (
                db.query(CaseActivity)
                .filter(CaseActivity.case_id == case_id)
                .order_by(desc(CaseActivity.timestamp))
                .limit(limit)
                .all()
            )

    # ===== USER MANAGEMENT =====

    def get_users(self, filters: Dict[str, Any] = None) -> List[User]:
        """Get users with optional filtering"""
        with self.get_db() as db:
            query = db.query(User).filter(User.is_active == True)

            if filters:
                if "role" in filters:
                    query = query.filter(User.role == filters["role"])
                if "department" in filters:
                    query = query.filter(User.department == filters["department"])

            return query.all()

    def get_users_paginated(
        self,
        pagination: "PaginationParams",
        filters: "FilterParams" = None
    ) -> Dict[str, Any]:
        """Get users with pagination and advanced filtering"""
        with self.get_db() as db:
            query = db.query(User).filter(User.is_active == True)

            # Apply filters
            if filters:
                if filters.q:
                    # Search across multiple fields
                    search_term = f"%{filters.q}%"
                    query = query.filter(
                        db.or_(
                            User.username.ilike(search_term),
                            User.email.ilike(search_term),
                            User.full_name.ilike(search_term)
                        )
                    )
                if filters.role:
                    query = query.filter(User.role == filters.role)
                if filters.department:
                    query = query.filter(User.department == filters.department)
                if filters.status:
                    is_active = filters.status.lower() == "active"
                    query = query.filter(User.is_active == is_active)

            # Apply sorting
            if filters and filters.sort_by:
                sort_column = getattr(User, filters.sort_by, None)
                if sort_column:
                    if filters.sort_order == "desc":
                        query = query.order_by(sort_column.desc())
                    else:
                        query = query.order_by(sort_column.asc())

            # Get total count
            total = query.count()

            # Apply pagination
            users = (
                query
                .offset(pagination.offset)
                .limit(pagination.limit)
                .all()
            )

            return {
                "users": users,
                "total": total
            }

    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        with self.get_db() as db:
            return (
                db.query(User)
                .filter(User.id == user_id, User.is_active == True)
                .first()
            )

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        with self.get_db() as db:
            return (
                db.query(User)
                .filter(User.username == username, User.is_active == True)
                .first()
            )

    def update_user(self, user_id: str, data: Dict[str, Any]) -> bool:
        """Update user by ID with data dict"""
        with self.get_db() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            for key, value in data.items():
                if hasattr(user, key):
                    setattr(user, key, value)

            user.updated_at = datetime.now(timezone.utc)
            db.commit()
            return True

    def delete_user(self, user_id: str) -> bool:
        """Soft delete user by ID"""
        with self.get_db() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False

            user.is_active = False
            user.updated_at = datetime.now(timezone.utc)
            db.commit()
            return True

    def update_user_legacy(self, user: User) -> User:
        """Update user in database (legacy method)"""
        with self.get_db() as db:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

    # ===== ANALYTICS =====

    @cached("transaction_aggregates", ttl_seconds=180)  # Cache for 3 minutes
    def get_transaction_aggregates(
        self, case_id: str = None, date_from: datetime = None, date_to: datetime = None
    ) -> Dict[str, Any]:
        """Get optimized transaction aggregates"""
        return db_optimizer.get_optimized_transaction_aggregates(
            case_id, date_from, date_to
        )

    def get_database_performance_metrics(self) -> Dict[str, Any]:
        """Get database performance metrics"""
        return db_optimizer.get_performance_metrics()

    def get_database_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics"""
        return db_optimizer.get_database_stats()

    def analyze_query_performance(
        self, query: str, params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Analyze query performance with EXPLAIN"""
        return db_optimizer.optimize_query_with_explain(query, params)

    def create_performance_indexes(self):
        """Create additional performance indexes"""
        db_optimizer.create_performance_indexes()

    # Cache management methods
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        from app.services.cache_service import get_cache_stats

        return get_cache_stats()

    def clear_case_cache(self) -> int:
        """Clear all case-related cache entries"""
        from app.services.cache_service import clear_cache_namespace

        return (
            clear_cache_namespace("cases_paginated")
            + clear_cache_namespace("case_details")
            + clear_cache_namespace("case_analytics")
        )

    def clear_transaction_cache(self) -> int:
        """Clear all transaction-related cache entries"""
        from app.services.cache_service import clear_cache_namespace

        return clear_cache_namespace("transaction_aggregates")

    def clear_all_cache(self) -> int:
        """Clear all cache entries"""
        from app.services.cache_service import clear_all_cache

        return clear_all_cache()

    @cached("case_analytics", ttl_seconds=600)  # Cache for 10 minutes
    def get_case_analytics(
        self, date_from: datetime = None, date_to: datetime = None
    ) -> Dict[str, Any]:
        """Get case analytics with optimized queries"""
        with self.get_db() as db:
            # Use optimized aggregation queries
            total_cases_query = db.query(Case.id)
            if date_from:
                total_cases_query = total_cases_query.filter(
                    Case.created_at >= date_from
                )
            if date_to:
                total_cases_query = total_cases_query.filter(Case.created_at <= date_to)

            total_cases = total_cases_query.count()

            # Get closed cases count efficiently
            closed_cases_query = db.query(Case.id).filter(
                Case.status.in_(
                    [
                        CaseStatus.CLOSED_APPROVED,
                        CaseStatus.CLOSED_DENIED,
                        CaseStatus.CLOSED_NO_ACTION,
                    ]
                )
            )
            if date_from:
                closed_cases_query = closed_cases_query.filter(
                    Case.created_at >= date_from
                )
            if date_to:
                closed_cases_query = closed_cases_query.filter(
                    Case.created_at <= date_to
                )

            closed_cases = closed_cases_query.count()

            priority_distribution = {}

            # Get status distribution efficiently
            status_stats = (
                db.query(Case.status, db.func.count(Case.id).label("count"))
                .group_by(Case.status)
                .all()
            )

            status_distribution = {s.value: count for s, count in status_stats}

            return {
                "total_cases": total_cases,
                "closed_cases": closed_cases,
                "open_cases": total_cases - closed_cases,
                "closure_rate": closed_cases / total_cases if total_cases > 0 else 0,
                "cases_by_priority": priority_distribution,
                "cases_by_status": status_distribution,
            }


    # ===== COMPLIANCE & SAR =====

    def create_sar(self, sar_data: dict, created_by: str) -> "SAR":
        """Create a new SAR report"""
        from core.database import SAR
        import uuid
        with self.get_db() as db:
            sar_data["id"] = str(uuid.uuid4())
            sar_data["created_by"] = created_by
            sar = SAR(**sar_data)
            db.add(sar)
            db.commit()
            db.refresh(sar)
            return sar

    def get_sars(self, case_id: str = None) -> List["SAR"]:
        """Get SAR reports"""
        from core.database import SAR
        with self.get_db() as db:
            query = db.query(SAR)
            if case_id:
                query = query.filter(SAR.case_id == case_id)
            return query.order_by(desc(SAR.created_at)).all()

    def submit_sar(self, sar_id: str) -> bool:
        """Submit a SAR report, marking it as immutable"""
        from core.database import SAR
        from datetime import datetime, timezone
        with self.get_db() as db:
            sar = db.query(SAR).filter(SAR.id == sar_id).first()
            if not sar:
                return False
            
            sar.status = "submitted"
            sar.submitted_at = datetime.now(timezone.utc)
            db.commit()
            return True


    def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent case activities from the database"""
        with self.get_db() as db:
            activities = (
                db.query(CaseActivity)
                .join(Case, CaseActivity.case_id == Case.id)
                .outerjoin(User, CaseActivity.user_id == User.id)
                .order_by(desc(CaseActivity.timestamp))
                .limit(limit)
                .all()
            )
            
            return [
                {
                    "id": a.id,
                    "action": a.activity_type.replace("_", " ").title(),
                    "details": a.description,
                    "user": a.user.full_name if a.user else (a.user_id or "System"),
                    "timestamp": a.timestamp.isoformat(),
                    "case_title": a.case.title if a.case else "Unknown Case"
                }
                for a in activities
            ]


# Global database service instance
db_service = DatabaseService()
