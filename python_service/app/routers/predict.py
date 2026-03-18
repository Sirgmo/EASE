"""
Prediction Endpoints

Endpoints for AI-powered predictions including risk scores.
"""

from fastapi import APIRouter, HTTPException

from app.models.risk import PropertyInput, RiskScoreResponse
from app.services.risk_service import risk_service

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post(
    "/risk_score",
    response_model=RiskScoreResponse,
    summary="Predict property risk score",
    description="""
    Analyze a property and return a comprehensive risk assessment.

    The risk score ranges from 0-100 where:
    - **0-39**: CRITICAL risk - Major concerns identified
    - **40-59**: HIGH risk - Significant issues to address
    - **60-79**: MEDIUM risk - Some concerns worth investigating
    - **80-100**: LOW risk - Property appears to be low risk

    The assessment considers:
    - Environmental factors (flood zones, soil stability)
    - Permit history and compliance
    - Market conditions and volatility
    - Structural considerations
    - Legal/title factors
    """,
    responses={
        200: {
            "description": "Successful risk assessment",
            "content": {
                "application/json": {
                    "example": {
                        "score": 85,
                        "risk_level": "LOW",
                        "factors": [
                            "Flood zone negative",
                            "Permit history clear",
                            "Market volatility stable"
                        ],
                        "detailed_factors": [
                            {
                                "category": "Environmental",
                                "description": "Property is not in a flood zone",
                                "impact": "positive",
                                "weight": 0.25
                            }
                        ],
                        "confidence": 0.87,
                        "property_address": "123 Queen Street West, Toronto, ON",
                        "model_version": "mock-v1.0"
                    }
                }
            }
        },
        422: {"description": "Validation error in request body"},
    }
)
async def predict_risk_score(property_input: PropertyInput) -> RiskScoreResponse:
    """
    Predict the risk score for a property based on various factors.

    - **address**: Full street address of the property
    - **city**: City name
    - **province**: Province code (e.g., ON, BC, AB)
    - **postal_code**: Optional postal code for more precise analysis
    - **property_type**: Type of property (house, condo, townhouse, etc.)
    - **listing_price**: Optional listing price for market analysis
    - **year_built**: Optional year built for structural assessment
    """
    try:
        return risk_service.assess_property(property_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing risk assessment: {str(e)}")


@router.get(
    "/risk_score/factors",
    summary="Get available risk factors",
    description="Returns the list of risk factor categories considered in assessments."
)
async def get_risk_factors() -> dict:
    """Get information about risk factors used in assessments."""
    return {
        "categories": [
            {
                "name": "Environmental",
                "description": "Flood zones, soil stability, radon levels, environmental hazards",
                "weight_range": "15-25%"
            },
            {
                "name": "Permits",
                "description": "Building permit history, open permits, unpermitted work",
                "weight_range": "10-20%"
            },
            {
                "name": "Market",
                "description": "Price trends, volatility, appreciation rates, days on market",
                "weight_range": "15-25%"
            },
            {
                "name": "Structural",
                "description": "Building age, major systems condition, foundation concerns",
                "weight_range": "20-30%"
            },
            {
                "name": "Legal",
                "description": "Title clarity, liens, easements, HOA/condo corporation health",
                "weight_range": "15-25%"
            }
        ],
        "score_interpretation": {
            "0-39": "CRITICAL - Major red flags identified",
            "40-59": "HIGH - Significant concerns to investigate",
            "60-79": "MEDIUM - Some issues worth reviewing",
            "80-100": "LOW - Property appears relatively low risk"
        }
    }
