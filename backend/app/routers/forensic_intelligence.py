from datetime import datetime
from typing import Any

from app.services.infrastructure.auth_service import auth_service
from app.services.intelligence.aml_service import get_aml_service
from app.services.intelligence.behavior_engine import get_behavior_service
from app.services.intelligence.coc_service import get_coc_service
from app.services.intelligence.forensic_intelligence import get_forensic_intelligence
from app.services.intelligence.juridical_anchor import get_juridical_anchor
from app.services.intelligence.zenith_horizon import get_zenith_horizon
from app.services.intelligence.zenith_scoring import get_zenith_scoring
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.database import get_db

router = APIRouter(
    tags=["Forensic Intelligence"],
    responses={404: {"description": "Not found"}},
)

# --- Request Models ---


class RedactionRequest(BaseModel):
    transaction_id: str
    masked_name: str


class LIBRRequest(BaseModel):
    account_id: str
    start_date: datetime
    end_date: datetime


class IntentRequest(BaseModel):
    evidence_id: str
    content: str


# --- Endpoints ---


@router.post("/triangulate")
async def triangulate_redaction(
    request: RedactionRequest,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Unmask redacted transaction names using probabilistic triangulation."""
    intel = get_forensic_intelligence(db)
    return await intel["triangulation"].unmask_redaction(
        request.transaction_id, request.masked_name
    )


@router.post("/libr-analysis")
async def run_libr_analysis(
    request: LIBRRequest,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Analyze mixed funds (personal/business) using the Lowest Intermediate Balance Rule."""
    intel = get_forensic_intelligence(db)
    return intel["libr"].analyze_mixed_funds(
        request.account_id, request.start_date, request.end_date
    )


@router.post("/attribute-intent")
async def attribute_intent(
    request: IntentRequest,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Determine Mens Rea (Theory of Intent) from forensic evidence."""
    intel = get_forensic_intelligence(db)
    return await intel["mens_rea"].attribute_intent(
        request.evidence_id, request.content
    )


@router.get("/mirror-detection/{account_id}")
async def mirror_detection(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Detect equal and opposite 'mirror' transactions."""
    intel = get_forensic_intelligence(db)
    return await intel["mirror_matcher"].find_mirror_pairs(account_id)


@router.get("/zenith-score/{project_id}")
async def get_zenith_score(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Get the overall Zenith health score for a project."""
    scoring = get_zenith_scoring(db)
    return await scoring["scorecard"].calculate_project_score(project_id)


@router.post("/validate-imputation")
async def validate_imputation(
    original: dict[str, Any],
    imputed: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Validate AI-imputed forensic data for legal resilience."""
    scoring = get_zenith_scoring(db)
    return scoring["validator"].validate_imputation(original, imputed)


@router.get("/aml/structuring/{account_id}")
async def check_structuring(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Check for structuring (Smurfing) patterns."""
    aml = get_aml_service(db)
    return await aml.detect_structuring(account_id)


@router.get("/aml/ubo-trace/{entity_name}")
async def trace_ubo(
    entity_name: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Trace Ultimate Beneficial Owners (UBO) using layering analysis."""
    aml = get_aml_service(db)
    return await aml.link_ubo(entity_name)


@router.post("/sign-report")
async def sign_forensic_report(
    project_id: str,
    content: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Sign a forensic report with Post-Quantum resistant signatures."""
    anchor = get_juridical_anchor(db)
    return await anchor.sign_report(project_id, content)


@router.post("/zenith/federated-sync")
async def zenith_federated_sync(
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Synchronize local knowledge with the Federated Forensic Mesh."""
    horizon = get_zenith_horizon()
    return await horizon["federated"].synchronize_weights()


@router.get("/zenith/shield-verify/{artifact_id}")
async def zenith_shield_verify(
    artifact_id: str, current_user: Any = Depends(auth_service.get_current_user)
):
    """Verify artifact integrity using Adversarial Forensic Shield."""
    horizon = get_zenith_horizon()
    return await horizon["adversarial"].verify_artifact(artifact_id)


@router.post("/zenith/autonomous-hunt")
async def zenith_autonomous_hunt(
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Execute Autonomous Forensic Hunting Agents."""
    horizon = get_zenith_horizon()
    return await horizon["autonomous"].run_discovery_cycle()


@router.get("/evidence/{evidence_id}/coc")
async def get_evidence_coc(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Retrieve the litigation-grade Chain of Custody for an evidence item."""
    query = "SELECT evidence_metadata FROM evidence WHERE id = :id"
    row = db.execute(text(query), {"id": evidence_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Evidence not found")

    import json

    metadata = json.loads(row[0]) if row[0] else {}
    return metadata.get("chain_of_custody", [])


@router.post("/evidence/{evidence_id}/coc")
async def log_coc_event(
    evidence_id: str,
    action: str,
    notes: str | None = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Log a new Chain of Custody event."""
    coc = get_coc_service(db)
    return await coc.log_event(evidence_id, action, current_user.id, notes)


@router.get("/aml/behavior-baseline/{account_id}")
async def get_behavior_baseline(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Get the calculated behavior baseline for an account."""
    behavior = get_behavior_service(db)
    return await behavior.get_account_baseline(account_id)


@router.post("/aml/behavior-check/{account_id}")
async def check_behavior_anomalies(
    account_id: str,
    transactions: list[dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth_service.get_current_user),
):
    """Check a batch of transactions against the behavior baseline."""
    behavior = get_behavior_service(db)
    return await behavior.detect_anomalies(account_id, transactions)
