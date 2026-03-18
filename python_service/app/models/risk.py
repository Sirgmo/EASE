from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PropertyType(str, Enum):
    HOUSE = "house"
    CONDO = "condo"
    TOWNHOUSE = "townhouse"
    SEMI_DETACHED = "semi-detached"
    LAND = "land"


class PropertyInput(BaseModel):
    """Input schema for property risk assessment"""

    address: str = Field(..., description="Full property address", min_length=5)
    city: str = Field(..., description="City name")
    province: str = Field(..., description="Province code (e.g., ON, BC)")
    postal_code: str | None = Field(None, description="Postal code")
    property_type: PropertyType = Field(default=PropertyType.HOUSE)
    listing_price: float | None = Field(None, gt=0, description="Listing price in CAD")
    year_built: int | None = Field(None, ge=1800, le=2030)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "address": "123 Queen Street West, Unit 2405",
                    "city": "Toronto",
                    "province": "ON",
                    "postal_code": "M5H 2N2",
                    "property_type": "condo",
                    "listing_price": 899000,
                    "year_built": 2019
                }
            ]
        }
    }


class RiskFactor(BaseModel):
    """Individual risk factor"""

    category: str = Field(..., description="Category of risk factor")
    description: str = Field(..., description="Human-readable description")
    impact: Literal["positive", "negative", "neutral"] = Field(..., description="Impact on overall risk")
    weight: float = Field(..., ge=0, le=1, description="Weight/importance of this factor")


class RiskScoreResponse(BaseModel):
    """Response schema for property risk assessment"""

    score: int = Field(..., ge=0, le=100, description="Overall risk score (0=highest risk, 100=lowest risk)")
    risk_level: RiskLevel = Field(..., description="Categorical risk level")
    factors: list[str] = Field(..., description="Summary of key risk factors")
    detailed_factors: list[RiskFactor] = Field(default=[], description="Detailed breakdown of risk factors")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence in this prediction")

    # Metadata
    property_address: str = Field(..., description="Address that was analyzed")
    model_version: str = Field(default="mock-v1.0", description="Version of the risk model used")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
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
            ]
        }
    }
