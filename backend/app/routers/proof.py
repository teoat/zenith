"""
Proof API Router

Provides endpoints for fraud proof mechanisms that generate court-admissible evidence:
- Metadata correlation detection
- Temporal burst pattern analysis
- Immutable audit chain verification
- Shell network/community detection
"""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.services.graph_service import relationship_graph
from app.services.immutable_audit_chain import (
    immutable_audit_chain,
)
from app.services.infrastructure.auth_service import auth_service
from app.services.intelligence.metadata_correlation_service import (
    MetadataCorrelationEngine,
)
from app.services.temporal_burst_detector import (
    TemporalBurstDetector,
    temporal_burst_detector,
)
from core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/proof", tags=["fraud-proof"])

# ---- Test placeholders (allow tests to patch module-level dependencies) ----
if "get_current_user" not in globals():
    try:
        get_current_user = auth_service.get_current_user
    except Exception:

        def get_current_user(*args, **kwargs):
            return None


if "require_permission" not in globals():

    def require_permission(*args, **kwargs):
        def _dep(*a, **k):
            return None

        return _dep


for _svc in (
    "relationship_graph",
    "metadata_correlation_engine",
    "immutable_audit_chain",
):
    if _svc not in globals():
        globals()[_svc] = None


# ===== METADATA CORRELATION ENDPOINTS =====


@router.get("/metadata-correlations/{case_id}")
def get_metadata_correlations(case_id: str, db: Session = Depends(get_db)):
    """
    Get metadata correlations for a case.

    Detects relationships between entities via shared metadata:
    - Same phone number
    - Same email address
    - Same physical address
    - Same IP address

    Returns:
        Correlation results with confidence scores
    """
    try:
        engine = MetadataCorrelationEngine(db)
        correlations = engine.find_all_correlations(case_id)

        return {
            "success": True,
            "case_id": case_id,
            "analyzed_at": datetime.now(UTC).isoformat(),
            "correlation_count": len(correlations),
            "correlations": correlations,
            "summary": {
                "phone_correlations": len([c for c in correlations if c.get("metadata_type") == "phone"]),
                "email_correlations": len([c for c in correlations if c.get("metadata_type") == "email"]),
                "address_correlations": len([c for c in correlations if c.get("metadata_type") == "address"]),
                "ip_correlations": len([c for c in correlations if c.get("metadata_type") == "ip_address"]),
            },
        }
    except Exception as e:
        logger.error(f"Metadata correlation error for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== TEMPORAL BURST DETECTION ENDPOINTS =====


@router.get("/temporal-bursts/{case_id}")
def detect_temporal_bursts(
    case_id: str,
    burst_threshold: int = Query(10, description="Minimum transactions for burst detection"),
    burst_window_hours: int = Query(48, description="Time window in hours"),
    structuring_threshold: float = Query(10000, description="Reporting threshold amount"),
    db: Session = Depends(get_db),
):
    """
    Detect temporal burst patterns in case transactions.

    Patterns detected:
    - Burst: Rapid transaction sequences (10+ in 48 hours default)
    - Structuring: Amounts clustering below reporting threshold
    - Velocity: Sudden increases in transaction frequency

    Returns:
        Burst analysis results with alerts and risk scores
    """
    try:
        # Get transactions for case
        from core.database import Transaction

        transactions = db.query(Transaction).filter(Transaction.case_id == case_id).all()

        # Convert to dictionaries
        txn_dicts = []
        for txn in transactions:
            txn_dicts.append(
                {
                    "id": txn.id,
                    "customer_id": txn.account_id,
                    "amount": float(txn.amount) if txn.amount else 0,
                    "date": txn.date.isoformat() if txn.date else None,
                    "customer_name": txn.account_id,
                }
            )

        # Create detector with custom thresholds
        detector = TemporalBurstDetector(
            burst_threshold=burst_threshold,
            burst_window_hours=burst_window_hours,
            structuring_threshold=structuring_threshold,
        )

        results = detector.analyze_transactions(txn_dicts, case_id=case_id)

        return {"success": True, **results}

    except Exception as e:
        logger.error(f"Temporal burst detection error for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/temporal-bursts/analyze")
def analyze_transactions_for_bursts(
    transactions: list[dict],
    burst_threshold: int = Query(10, description="Minimum transactions for burst detection"),
    burst_window_hours: int = Query(48, description="Time window in hours"),
):
    """
    Analyze provided transactions for temporal burst patterns.

    Useful for ad-hoc analysis without a case context.

    Args:
        transactions: List of transaction dictionaries with date, amount, customer_id

    Returns:
        Burst analysis results
    """
    try:
        detector = TemporalBurstDetector(burst_threshold=burst_threshold, burst_window_hours=burst_window_hours)

        results = detector.analyze_transactions(transactions)

        return {"success": True, **results}

    except Exception as e:
        logger.error(f"Temporal burst analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== AUDIT CHAIN ENDPOINTS =====


@router.get("/audit-chain/verify")
def verify_audit_chain():
    """
    Verify the integrity of the immutable audit chain.

    Checks:
    - Chain linkage (each entry links to previous)
    - HMAC signatures validity
    - Data hash integrity

    Returns:
        Verification result with status and any detected issues
    """
    try:
        result = immutable_audit_chain.verify_chain_integrity()

        return {"success": True, **result}

    except Exception as e:
        logger.error(f"Audit chain verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-chain/export")
def export_audit_chain_proof(
    start_sequence: int | None = Query(None, description="Starting sequence number"),
    end_sequence: int | None = Query(None, description="Ending sequence number"),
    entity_type: str | None = Query(None, description="Filter by entity type"),
    entity_id: str | None = Query(None, description="Filter by entity ID"),
):
    """
    Export chain proof for court-admissible evidence.

    Generates a cryptographically signed proof document containing:
    - Filtered audit entries
    - Chain verification data
    - HMAC proof signature

    Returns:
        Court-ready proof document
    """
    try:
        proof = immutable_audit_chain.get_chain_proof(
            start_sequence=start_sequence,
            end_sequence=end_sequence,
            entity_type=entity_type,
            entity_id=entity_id,
        )

        return {"success": True, **proof}

    except Exception as e:
        logger.error(f"Audit chain export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-chain/stats")
def get_audit_chain_stats():
    """Get audit chain statistics"""
    try:
        stats = immutable_audit_chain.get_chain_stats()

        return {"success": True, **stats}

    except Exception as e:
        logger.error(f"Audit chain stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit-chain/append")
def append_audit_entry(
    event_type: str = Query(..., description="Type of event"),
    action: str = Query(..., description="Action taken"),
    entity_type: str | None = Query(None, description="Entity type"),
    entity_id: str | None = Query(None, description="Entity ID"),
    user_id: str | None = Query(None, description="User ID"),
    data: dict | None = None,
):
    """
    Append a new entry to the immutable audit chain.

    This creates a cryptographically linked entry with:
    - Link to previous entry (previous_hash)
    - HMAC signature
    - Data hash
    """
    try:
        entry = immutable_audit_chain.append_entry(
            event_type=event_type,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            data=data,
        )

        return {"success": True, "entry": entry}

    except Exception as e:
        logger.error(f"Audit chain append error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== COMMUNITY DETECTION ENDPOINTS =====


@router.get("/community-detection/{case_id}")
def detect_shell_networks(
    case_id: str,
    min_community_size: int = Query(3, description="Minimum community size"),
    max_density: float = Query(0.9, description="Maximum density threshold"),
    db: Session = Depends(get_db),
):
    """
    Detect potential shell company networks in case data.

    Uses Louvain community detection to identify:
    - Tight-knit transaction clusters
    - Circular transaction patterns
    - Entities with high internal transaction ratios

    Returns:
        Detected shell networks with risk scoring
    """
    try:
        # Get transactions for case to build graph
        from core.database import Transaction

        transactions = db.query(Transaction).filter(Transaction.case_id == case_id).all()

        # Convert to dictionaries for graph building
        txn_dicts = []
        for txn in transactions:
            txn_dicts.append(
                {
                    "id": txn.id,
                    "customer_id": txn.account_id,
                    "account_id": txn.account_id,
                    "amount": float(txn.amount) if txn.amount else 0,
                    "date": txn.date.isoformat() if txn.date else None,
                    "merchant_name": getattr(txn, "counterparty", None) or getattr(txn, "description", "Unknown"),
                }
            )

        if not txn_dicts:
            return {
                "success": True,
                "case_id": case_id,
                "analyzed_at": datetime.now(UTC).isoformat(),
                "transaction_count": 0,
                "shell_networks": [],
                "summary": {
                    "total_communities": 0,
                    "suspicious_networks": 0,
                    "highest_risk_score": 0,
                },
            }

        # Build graph and detect shell networks
        relationship_graph.build_graph_from_transactions(txn_dicts)
        shell_networks = relationship_graph.detect_shell_networks(
            min_community_size=min_community_size, max_density=max_density
        )

        return {
            "success": True,
            "case_id": case_id,
            "analyzed_at": datetime.now(UTC).isoformat(),
            "transaction_count": len(txn_dicts),
            "shell_networks": shell_networks,
            "summary": {
                "total_communities": len(relationship_graph.detect_communities()),
                "suspicious_networks": len(shell_networks),
                "highest_risk_score": max([n["risk_score"] for n in shell_networks], default=0),
            },
        }

    except Exception as e:
        logger.error(f"Community detection error for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== PROOF SUMMARY ENDPOINT =====


@router.get("/summary/{case_id}")
def get_proof_summary(case_id: str, db: Session = Depends(get_db)):
    """
    Get combined proof visualization data for a case.

    Aggregates all proof mechanisms into a single dashboard-ready response:
    - Metadata correlation summary
    - Temporal burst summary
    - Audit chain status
    - Shell network summary

    Returns:
        Combined proof summary with confidence scores
    """
    try:
        # Metadata correlations
        try:
            engine = MetadataCorrelationEngine(db)
            correlations = engine.find_all_correlations(case_id)
            metadata_summary = {
                "total_correlations": len(correlations),
                "types": {
                    "phone": len([c for c in correlations if c.get("metadata_type") == "phone"]),
                    "email": len([c for c in correlations if c.get("metadata_type") == "email"]),
                    "address": len([c for c in correlations if c.get("metadata_type") == "address"]),
                    "ip": len([c for c in correlations if c.get("metadata_type") == "ip_address"]),
                },
                "confidence": min(1.0, len(correlations) * 0.15) if correlations else 0,
            }
        except Exception as e:
            logger.warning(f"Metadata correlation failed: {e}")
            metadata_summary = {
                "total_correlations": 0,
                "types": {},
                "confidence": 0,
                "error": str(e),
            }

        # Temporal bursts
        try:
            from core.database import Transaction

            transactions = db.query(Transaction).filter(Transaction.case_id == case_id).all()

            txn_dicts = [
                {
                    "id": txn.id,
                    "customer_id": txn.account_id,
                    "amount": float(txn.amount) if txn.amount else 0,
                    "date": txn.date.isoformat() if txn.date else None,
                }
                for txn in transactions
            ]

            burst_results = temporal_burst_detector.analyze_transactions(txn_dicts, case_id)
            burst_summary = {
                "alerts": len(burst_results.get("alerts", [])),
                "risk_score": burst_results.get("summary", {}).get("overall_risk_score", 0),
                "patterns": {
                    "burst": burst_results.get("summary", {}).get("burst_patterns", 0),
                    "structuring": burst_results.get("summary", {}).get("structuring_patterns", 0),
                    "velocity": burst_results.get("summary", {}).get("velocity_anomalies", 0),
                },
                "confidence": min(
                    1.0,
                    burst_results.get("summary", {}).get("overall_risk_score", 0) / 100,
                ),
            }
        except Exception as e:
            logger.warning(f"Temporal burst detection failed: {e}")
            burst_summary = {
                "alerts": 0,
                "risk_score": 0,
                "patterns": {},
                "confidence": 0,
                "error": str(e),
            }

        # Audit chain status
        try:
            chain_verification = immutable_audit_chain.verify_chain_integrity()
            audit_summary = {
                "status": chain_verification.get("status", "unknown"),
                "total_entries": chain_verification.get("total_entries", 0),
                "integrity_percentage": chain_verification.get("integrity_percentage", 0),
                "confidence": chain_verification.get("integrity_percentage", 0) / 100,
            }
        except Exception as e:
            logger.warning(f"Audit chain verification failed: {e}")
            audit_summary = {
                "status": "error",
                "total_entries": 0,
                "integrity_percentage": 0,
                "confidence": 0,
                "error": str(e),
            }

        # Shell networks
        try:
            shell_networks = relationship_graph.detect_shell_networks()
            shell_summary = {
                "networks_detected": len(shell_networks),
                "highest_risk_score": max([n["risk_score"] for n in shell_networks], default=0),
                "confidence": (min(1.0, len(shell_networks) * 0.2) if shell_networks else 0),
            }
        except Exception as e:
            logger.warning(f"Shell network detection failed: {e}")
            shell_summary = {
                "networks_detected": 0,
                "highest_risk_score": 0,
                "confidence": 0,
                "error": str(e),
            }

        # Calculate overall proof score
        overall_confidence = (
            metadata_summary.get("confidence", 0) * 0.25
            + burst_summary.get("confidence", 0) * 0.30
            + audit_summary.get("confidence", 0) * 0.25
            + shell_summary.get("confidence", 0) * 0.20
        )

        return {
            "success": True,
            "case_id": case_id,
            "analyzed_at": datetime.now(UTC).isoformat(),
            "proof_summary": {
                "metadata_correlations": metadata_summary,
                "temporal_bursts": burst_summary,
                "audit_chain": audit_summary,
                "shell_networks": shell_summary,
                "overall_confidence": round(overall_confidence, 2),
                "court_readiness": (
                    "high" if overall_confidence >= 0.7 else "medium" if overall_confidence >= 0.4 else "low"
                ),
            },
        }

    except Exception as e:
        logger.error(f"Proof summary error for case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
