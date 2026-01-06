from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["Explainable AI"])


class ExplanationRequest(BaseModel):
    score_id: str
    feature_vector: dict[str, Any] | None = None


class ExplanationResponse(BaseModel):
    score_id: str
    base_value: float
    shap_values: dict[str, float]
    narrative: str
    confidence: float


@router.get("/explain/{score_id}", response_model=ExplanationResponse)
async def explain_score(score_id: str):
    """
    Get SHAP values and narrative explanation for a specific AI score.
    """
    # Mock SHAP calculation
    features = {
        "transaction_velocity": 0.35,
        "geo_mismatch": 0.42,
        "device_reputation": -0.12,
        "amount_deviation": 0.15,
    }

    narrative = (
        "The risk score is primarily driven by geospatial mismatch (+42%) and high transaction velocity (+35%). "
        "However, the device's known reputation lowered the score by 12%."
    )

    return ExplanationResponse(
        score_id=score_id,
        base_value=0.1,
        shap_values=features,
        narrative=narrative,
        confidence=0.92,
    )


@router.get("/explain/{score_id}/features", response_model=list[dict[str, Any]])
async def get_visual_data(score_id: str):
    """
    Get sorted feature contributions for tooltip visualization.
    """
    return [
        {"feature": "Geo Mismatch", "value": 0.42, "color": "red"},
        {"feature": "Velocity", "value": 0.35, "color": "orange"},
        {"feature": "Amount Dev", "value": 0.15, "color": "yellow"},
        {"feature": "Device Rep", "value": -0.12, "color": "green"},
    ]
