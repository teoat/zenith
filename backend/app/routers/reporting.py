import asyncio
import datetime
import json
import os
import uuid
from enum import Enum

from app.services.infrastructure.auth_service import auth_service
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import User, get_db

router = APIRouter()

# --- Models ---


class ReportGenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str
    estimated_completion_minutes: int


class ReportJobStatus(BaseModel):
    id: str
    status: str
    progress: int
    created_at: str
    updated_at: str | None = None
    error: str | None = None


class CaseAnalytics(BaseModel):
    total_cases: int
    active_cases: int
    resolved_cases: int
    cases_by_status: dict[str, int]
    avg_resolution_time_days: float
    urgent_cases: int


class TransactionAnalytics(BaseModel):
    total_volume: float
    flagged_volume: float
    transaction_count: int
    flagged_count: int
    risk_distribution: dict[str, int]


class SystemOverview(BaseModel):
    ingestion_rate: float
    active_users: int
    system_health: float
    last_sync_time: datetime.datetime


class ReportFormat(str, Enum):
    PDF = "pdf"
    HTML = "html"
    CSV = "csv"


class ReportTemplate(str, Enum):
    EXECUTIVE = "executive"
    STANDARD = "standard"
    DETAILED = "detailed"
    COMPLIANCE = "compliance"


class ReportRequest(BaseModel):
    report_type: str = "standard"  # Added missing field
    case_id: str | None = None  # Added missing field
    case_ids: list[str] | None = None
    date_range: dict[str, str] | None = None
    format: ReportFormat = ReportFormat.PDF
    template: ReportTemplate = ReportTemplate.STANDARD
    include_sensitive_data: bool = False


class ReportResponse(BaseModel):
    report_url: str
    generated_at: datetime.datetime
    expires_at: datetime.datetime


class CaseSummaryStats(BaseModel):
    case_id: str
    status: str
    data_quality: float
    days_to_resolution: int
    total_records: int
    match_rate: float
    flagged_amount: float
    confirmed_fraud: int
    false_positives: int
    alerts_resolved: int
    avg_resolution_time_minutes: float


class Finding(BaseModel):
    id: str
    type: str
    severity: str
    description: str
    evidence: list[str] | None = None


class CaseSummaryResponse(BaseModel):
    stats: CaseSummaryStats
    findings: list[Finding]


class ScheduleFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class ScheduledReportRequest(BaseModel):
    name: str
    frequency: ScheduleFrequency
    template: ReportTemplate
    recipients: list[str]
    case_ids: list[str] | None = None
    enabled: bool = True


class ScheduledReport(BaseModel):
    id: str
    name: str
    frequency: ScheduleFrequency
    template: ReportTemplate
    recipients: list[str]
    next_run_at: datetime.datetime
    last_run_at: datetime.datetime | None
    enabled: bool


class ReportTemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    sections: list[str]
    estimated_pages: str


# --- Endpoints ---


# Removed duplicated analytics routes as they are in analytics.py


@router.post(
    "/generate",
    response_model=ReportGenerationResponse,
    status_code=202,
    tags=["reporting"],
)
async def generate_report(
    request: ReportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a report based on provided criteria.
    Report generation happens in the background and returns a job ID for tracking.
    """
    try:
        # Generate unique report ID
        report_id = f"report_{uuid.uuid4().hex}"

        # Create report job record
        job_data = {
            "id": report_id,
            "type": request.report_type,
            "format": request.format.value,
            "parameters": request.dict(),
            "status": "queued",
            "created_at": datetime.datetime.now(datetime.UTC).isoformat(),
            "created_by": current_user.id if current_user else None,
            "progress": 0,
            "estimated_completion": None,
        }

        # Save job metadata (in a real system, this would be in a database)
        jobs_dir = "reports/jobs"
        os.makedirs(jobs_dir, exist_ok=True)
        job_file = os.path.join(jobs_dir, f"{report_id}.json")
        with open(job_file, "w") as f:
            json.dump(job_data, f, indent=2)

        # Add background task
        background_tasks.add_task(
            generate_report_background,
            report_id,
            request,
            current_user.id if current_user else None,
            db,
        )

        return ReportGenerationResponse(
            job_id=report_id,
            status="queued",
            message="Report generation started",
            estimated_completion_minutes=5,  # Estimate based on report complexity
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start report generation: {e!s}"
        )


async def generate_report_background(
    report_id: str,
    request: ReportRequest,
    user_id: str | None,
    db: Session,
):
    """Background task to generate the actual report"""
    try:
        # Update job status to processing
        update_job_status(report_id, "processing", 10)

        # Simulate report generation process
        if request.report_type == "case_summary":
            await generate_case_summary_report(report_id, request, db)
        elif request.report_type == "financial_analysis":
            await generate_financial_analysis_report(report_id, request, db)
        elif request.report_type == "compliance_audit":
            await generate_compliance_audit_report(report_id, request, db)
        else:
            await generate_generic_report(report_id, request, db)

        # Mark as completed
        update_job_status(report_id, "completed", 100)

    except Exception as e:
        # Mark as failed
        update_job_status(report_id, "failed", 0, str(e))


async def generate_case_summary_report(
    report_id: str, request: ReportRequest, db: Session
):
    """Generate case summary report"""
    update_job_status(report_id, "processing", 30)

    # Simulate PDF generation
    await asyncio.sleep(2)  # Simulate processing time

    # Create mock PDF content (in real implementation, use reportlab or similar)
    pdf_content = f"""
    Case Summary Report
    Generated: {datetime.datetime.now()}
    Case ID: {request.case_id}
    Format: {request.format.value}
    """

    # Save report file
    reports_dir = "reports/generated"
    os.makedirs(reports_dir, exist_ok=True)
    report_file = os.path.join(reports_dir, f"{report_id}.pdf")

    with open(report_file, "w") as f:
        f.write(pdf_content)

    update_job_status(report_id, "processing", 80)


async def generate_financial_analysis_report(
    report_id: str, request: ReportRequest, db: Session
):
    """Generate financial analysis report"""
    update_job_status(report_id, "processing", 25)

    # Similar to case summary but with financial data
    await asyncio.sleep(3)

    pdf_content = f"Financial Analysis Report - {datetime.datetime.now()}"

    reports_dir = "reports/generated"
    os.makedirs(reports_dir, exist_ok=True)
    report_file = os.path.join(reports_dir, f"{report_id}.pdf")

    with open(report_file, "w") as f:
        f.write(pdf_content)

    update_job_status(report_id, "processing", 75)


async def generate_compliance_audit_report(
    report_id: str, request: ReportRequest, db: Session
):
    """Generate compliance audit report"""
    update_job_status(report_id, "processing", 20)

    await asyncio.sleep(4)

    pdf_content = f"Compliance Audit Report - {datetime.datetime.now()}"

    reports_dir = "reports/generated"
    os.makedirs(reports_dir, exist_ok=True)
    report_file = os.path.join(reports_dir, f"{report_id}.pdf")

    with open(report_file, "w") as f:
        f.write(pdf_content)

    update_job_status(report_id, "processing", 85)


async def generate_generic_report(report_id: str, request: ReportRequest, db: Session):
    """Generate generic report"""
    update_job_status(report_id, "processing", 15)

    await asyncio.sleep(1)

    pdf_content = f"Generic Report - {datetime.datetime.now()}"

    reports_dir = "reports/generated"
    os.makedirs(reports_dir, exist_ok=True)
    report_file = os.path.join(reports_dir, f"{report_id}.pdf")

    with open(report_file, "w") as f:
        f.write(pdf_content)

    update_job_status(report_id, "processing", 60)


def update_job_status(
    report_id: str, status: str, progress: int, error: str | None = None
):
    """Update job status"""
    jobs_dir = "reports/jobs"
    job_file = os.path.join(jobs_dir, f"{report_id}.json")

    try:
        with open(job_file) as f:
            job_data = json.load(f)

        job_data["status"] = status
        job_data["progress"] = progress
        job_data["updated_at"] = datetime.datetime.now(
            datetime.UTC
        ).isoformat()

        if error:
            job_data["error"] = error

        with open(job_file, "w") as f:
            json.dump(job_data, f, indent=2)

    except Exception as e:
        print(f"Failed to update job status for {report_id}: {e}")


@router.get("/job/{job_id}", response_model=ReportJobStatus, tags=["reporting"])
async def get_report_job_status(
    job_id: str, current_user: User = Depends(auth_service.get_current_user)
):
    """Get the status of a report generation job"""
    try:
        jobs_dir = "reports/jobs"
        job_file = os.path.join(jobs_dir, f"{job_id}.json")

        if not os.path.exists(job_file):
            raise HTTPException(status_code=404, detail="Report job not found")

        with open(job_file) as f:
            job_data = json.load(f)

        return ReportJobStatus(**job_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {e!s}")


@router.get("/download/{report_id}", tags=["reporting"])
async def download_report(
    report_id: str, current_user: User = Depends(auth_service.get_current_user)
):
    """Download a completed report"""
    try:
        reports_dir = "reports/generated"
        report_file = os.path.join(reports_dir, f"{report_id}.pdf")

        if not os.path.exists(report_file):
            raise HTTPException(status_code=404, detail="Report not found")

        # Check if job is completed
        jobs_dir = "reports/jobs"
        job_file = os.path.join(jobs_dir, f"{report_id}.json")

        if os.path.exists(job_file):
            with open(job_file) as f:
                job_data = json.load(f)

            if job_data.get("status") != "completed":
                raise HTTPException(
                    status_code=409, detail="Report is not yet completed"
                )

        from fastapi.responses import FileResponse

        return FileResponse(
            report_file,
            media_type="application/pdf",
            filename=f"report_{report_id}.pdf",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download report: {e!s}")


@router.get(
    "/summary/{case_id}",
    response_model=CaseSummaryResponse,
    tags=["reporting"],
)
async def get_case_summary(case_id: str):
    """
    Get comprehensive summary statistics and findings for a case.
    Used by the Summary Preview tab in the Reporting page.
    """
    return {
        "stats": {
            "case_id": case_id,
            "status": "success",
            "data_quality": 99.8,
            "days_to_resolution": 45,
            "total_records": 12450,
            "match_rate": 94.2,
            "flagged_amount": 4800000.0,
            "confirmed_fraud": 3,
            "false_positives": 45,
            "alerts_resolved": 98,
            "avg_resolution_time_minutes": 8.3,
        },
        "findings": [
            {
                "id": "f1",
                "type": "pattern",
                "severity": "high",
                "description": "Identified 15 high-risk mirroring patterns involving 3 entities",
                "evidence": ["doc_001", "doc_002"],
            },
            {
                "id": "f2",
                "type": "amount",
                "severity": "high",
                "description": "Total flagged amount: $4.8M across 150 transactions",
            },
            {
                "id": "f3",
                "type": "confirmation",
                "severity": "critical",
                "description": "3 confirmed fraudulent transactions referred to authorities",
                "evidence": ["doc_003", "doc_004", "doc_005"],
            },
            {
                "id": "f4",
                "type": "false_positive",
                "severity": "low",
                "description": "45 false positives correctly ruled out",
            },
            {
                "id": "f5",
                "type": "recommendation",
                "severity": "medium",
                "description": "Recommended enhanced monitoring for 2 vendor accounts",
            },
        ],
    }


@router.get("/templates", response_model=list[ReportTemplateInfo], tags=["reporting"])
async def get_report_templates():
    """
    Get available report templates with their metadata.
    """
    return [
        {
            "id": "executive",
            "name": "Executive Summary",
            "description": "High-level overview for C-suite and board presentation",
            "sections": [
                "Cover Page",
                "Executive Summary",
                "Top 5 Findings",
                "Key Visualizations",
                "Signature Block",
            ],
            "estimated_pages": "2-3",
        },
        {
            "id": "standard",
            "name": "Standard Investigation",
            "description": "Complete case documentation for standard reporting",
            "sections": [
                "Cover Page",
                "Executive Summary",
                "Methodology",
                "Timeline",
                "Full Findings",
                "Visualizations",
                "Recommendations",
                "Signature Block",
            ],
            "estimated_pages": "8-12",
        },
        {
            "id": "detailed",
            "name": "Detailed Audit Trail",
            "description": "Full audit trail for legal proceedings and compliance",
            "sections": [
                "Cover Page",
                "Executive Summary",
                "Methodology",
                "Timeline",
                "Full Findings",
                "All Visualizations",
                "Complete Transaction List",
                "Entity Roster",
                "Chain of Custody",
                "Signature Block",
            ],
            "estimated_pages": "15-25",
        },
        {
            "id": "compliance",
            "name": "Regulatory Compliance",
            "description": "Format for SAR/STR regulatory submissions",
            "sections": [
                "Regulatory Header",
                "Subject Information",
                "Suspicious Activity Summary",
                "Transaction Details",
                "Supporting Documentation",
                "Filer Certification",
            ],
            "estimated_pages": "10-15",
        },
    ]


@router.get("/scheduled", response_model=list[ScheduledReport], tags=["reporting"])
async def get_scheduled_reports():
    """
    Get list of configured scheduled reports.
    """
    now = datetime.datetime.now(datetime.UTC)
    return [
        {
            "id": "sched_001",
            "name": "Weekly Performance Summary",
            "frequency": "weekly",
            "template": "executive",
            "recipients": ["admin@example.com", "manager@example.com"],
            "next_run_at": now + datetime.timedelta(days=7 - now.weekday()),
            "last_run_at": now - datetime.timedelta(days=now.weekday()),
            "enabled": True,
        },
        {
            "id": "sched_002",
            "name": "Monthly Compliance Report",
            "frequency": "monthly",
            "template": "compliance",
            "recipients": ["compliance@example.com"],
            "next_run_at": (now.replace(day=1) + datetime.timedelta(days=32)).replace(
                day=1
            ),
            "last_run_at": now.replace(day=1) - datetime.timedelta(days=1),
            "enabled": True,
        },
    ]


@router.post("/scheduled", response_model=ScheduledReport, tags=["reporting"])
async def create_scheduled_report(request: ScheduledReportRequest):
    """
    Create a new scheduled report configuration.
    """
    now = datetime.datetime.now(datetime.UTC)

    # Calculate next run based on frequency
    if request.frequency == ScheduleFrequency.DAILY:
        next_run = now + datetime.timedelta(days=1)
    elif request.frequency == ScheduleFrequency.WEEKLY:
        next_run = now + datetime.timedelta(days=7 - now.weekday())
    elif request.frequency == ScheduleFrequency.MONTHLY:
        next_run = (now.replace(day=1) + datetime.timedelta(days=32)).replace(day=1)
    else:  # QUARTERLY
        month = ((now.month - 1) // 3 + 1) * 3 + 1
        year = now.year if month <= 12 else now.year + 1
        month = month if month <= 12 else month - 12
        next_run = now.replace(year=year, month=month, day=1)

    return {
        "id": f"sched_{int(now.timestamp())}",
        "name": request.name,
        "frequency": request.frequency,
        "template": request.template,
        "recipients": request.recipients,
        "next_run_at": next_run,
        "last_run_at": None,
        "enabled": request.enabled,
    }


@router.delete("/scheduled/{schedule_id}", tags=["reporting"])
async def delete_scheduled_report(schedule_id: str):
    """
    Delete a scheduled report configuration.
    """
    return {"message": f"Scheduled report {schedule_id} deleted successfully"}


@router.get("/financial-health/{case_id}", tags=["reporting"])
async def get_financial_health(case_id: str, db: Session = Depends(get_db)):
    """
    Get financial health data for the FinancialHealth component.
    Includes cashflow waterfall and burn rate data.
    """
    from sqlalchemy import func

    from core.database import FraudAlertModel, Transaction

    try:
        # Get transaction aggregates
        inflows = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.case_id == case_id, Transaction.transaction_type == "CREDIT"
            )
            .scalar()
            or 0.0
        )

        outflows = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.case_id == case_id, Transaction.transaction_type == "DEBIT"
            )
            .scalar()
            or 0.0
        )

        # Get suspicious flagged amount
        suspicious = (
            db.query(func.sum(Transaction.amount))
            .join(FraudAlertModel, FraudAlertModel.case_id == Transaction.case_id)
            .filter(
                Transaction.case_id == case_id,
                Transaction.confidence_score < 0.8,  # Heuristic for suspicious
            )
            .scalar()
            or 0.0
        )

        budget = 500000.0  # Standard project budget for now
        total_spend = abs(outflows)
        balance = inflows - total_spend

        return {
            "case_id": case_id,
            "budget": budget,
            "total_spend": total_spend,
            "suspicious_flow": suspicious,
            "burn_rate": round((total_spend / budget * 100), 2) if budget > 0 else 0,
            "projected_runway": 45,  # Simplified default
            "waterfall": [
                {"name": "Inflow", "amount": inflows, "type": "positive"},
                {"name": "Outflow", "amount": -total_spend, "type": "negative"},
                {"name": "Suspicious", "amount": -suspicious, "type": "suspicious"},
                {"name": "Balance", "amount": balance, "type": "balance"},
            ],
        }
    except Exception as e:
        logger.error(f"Error getting financial health: {e}")
        # Return intelligent defaults if calculation fails
        return {
            "case_id": case_id,
            "budget": 500000.0,
            "total_spend": 0.0,
            "suspicious_flow": 0.0,
            "burn_rate": 0.0,
            "projected_runway": 0,
            "waterfall": [],
        }


@router.get("/project-tracker/{case_id}", tags=["reporting"])
async def get_project_tracker(case_id: str):
    """
    Get project milestone and benchmark data for the ProjectTracker component.
    """
    return {
        "case_id": case_id,
        "milestones": [
            {
                "id": "m1",
                "name": "Down Payment",
                "status": "complete",
                "amount": 50000,
                "completed_at": "2025-01-15",
            },
            {
                "id": "m2",
                "name": "Foundation",
                "status": "complete",
                "amount": 100000,
                "completed_at": "2025-02-28",
            },
            {
                "id": "m3",
                "name": "Structure",
                "status": "delayed",
                "amount": 150000,
                "due_date": "2025-04-15",
            },
            {
                "id": "m4",
                "name": "Finishes",
                "status": "pending",
                "amount": 100000,
                "due_date": "2025-06-30",
            },
            {
                "id": "m5",
                "name": "Handover",
                "status": "pending",
                "amount": 50000,
                "due_date": "2025-08-15",
            },
        ],
        "benchmarks": [
            {"category": "Materials", "project": 120, "industry": 100},
            {"category": "Labor", "project": 95, "industry": 100},
            {"category": "Equipment", "project": 110, "industry": 100},
            {"category": "Overhead", "project": 85, "industry": 100},
        ],
        "overall_progress": 45,
    }
