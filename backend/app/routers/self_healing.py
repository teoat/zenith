import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/system/scripts", tags=["Self-Healing Scripts"])
logger = logging.getLogger(__name__)


class ScriptRequest(BaseModel):
    script_name: str
    target_service: str
    dry_run: bool = True


class ScriptExecutionLog(BaseModel):
    execution_id: str
    status: str
    output: list[str]


@router.post("/execute", response_model=ScriptExecutionLog)
async def execute_remediation_script(
    request: ScriptRequest, background_tasks: BackgroundTasks
):
    """
    Execute a predefined remediation script in a sandboxed environment.
    """
    if request.script_name == "restart_kafka_consumer":
        return ScriptExecutionLog(
            execution_id="exec_001",
            status="success",
            output=[
                "Stopping consumer...",
                "Waiting 5s...",
                "Starting consumer...",
                "Healthy.",
            ],
        )
    elif request.script_name == "flush_redis_cache":
        return ScriptExecutionLog(
            execution_id="exec_002",
            status="pending_approval",
            output=["Script requires manual approval for production environment."],
        )

    raise HTTPException(status_code=404, detail="Script not found in catalog")


@router.get("/approvals")
async def get_pending_approvals():
    """
    List scripts waiting for dual-control approval.
    """
    return [
        {"id": "exec_002", "script": "flush_redis_cache", "requester": "system_monitor"}
    ]
