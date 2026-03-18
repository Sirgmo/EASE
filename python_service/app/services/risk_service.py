"""
Risk Assessment Service

Mock implementation of property risk scoring.
In production, this would integrate with:
- Flood zone databases (FEMA, provincial)
- Historical permit data
- Market volatility indexes
- Crime statistics
- Environmental assessments
"""

import random
from typing import Tuple

from app.models.risk import (
    PropertyInput,
    RiskScoreResponse,
    RiskFactor,
    RiskLevel,
)


class RiskAssessmentService:
    """Service for assessing property risk scores"""

    # Mock risk factors by category
    ENVIRONMENTAL_FACTORS = [
        ("Flood zone negative", "positive", "Property is not in a designated flood zone"),
        ("Flood zone low risk", "positive", "Property is in a low-risk flood zone"),
        ("Flood zone moderate", "negative", "Property is in a moderate flood risk area"),
        ("Flood zone high risk", "negative", "Property is in a high-risk flood zone"),
        ("Soil stability good", "positive", "Geotechnical assessment shows stable soil"),
        ("Radon levels low", "positive", "Area has historically low radon levels"),
    ]

    PERMIT_FACTORS = [
        ("Permit history clear", "positive", "All permits properly filed and closed"),
        ("Recent renovation permitted", "positive", "Recent renovations have proper permits"),
        ("Open permit detected", "negative", "Property has an open/unclosed building permit"),
        ("Unpermitted work possible", "negative", "Signs of unpermitted modifications"),
    ]

    MARKET_FACTORS = [
        ("Market volatility stable", "positive", "Local market shows stable price trends"),
        ("Strong appreciation area", "positive", "Area has shown consistent appreciation"),
        ("Market cooling detected", "neutral", "Market shows signs of cooling"),
        ("Price decline risk", "negative", "Area prices have declined recently"),
    ]

    STRUCTURAL_FACTORS = [
        ("Building age appropriate", "positive", "Building age within normal range for area"),
        ("Recent major repairs", "positive", "Major systems recently updated"),
        ("Aging infrastructure", "negative", "Building systems approaching end of life"),
        ("Foundation concerns possible", "negative", "Area known for foundation issues"),
    ]

    LEGAL_FACTORS = [
        ("Title clear", "positive", "No liens or encumbrances detected"),
        ("No easement issues", "positive", "Property boundaries and easements clear"),
        ("HOA financially healthy", "positive", "Condo corporation is well-funded"),
        ("Reserve fund adequate", "positive", "Status certificate shows adequate reserves"),
        ("Special assessment risk", "negative", "Condo may face special assessments"),
        ("Litigation pending", "negative", "Property or building involved in litigation"),
    ]

    def __init__(self):
        self.model_version = "mock-v1.0"

    def _select_factors(self, category_factors: list, count: int = 1) -> list[Tuple[str, str, str]]:
        """Select random factors from a category"""
        return random.sample(category_factors, min(count, len(category_factors)))

    def _calculate_score_from_factors(self, factors: list[RiskFactor]) -> int:
        """Calculate overall score from factors (0-100, higher = lower risk)"""
        if not factors:
            return 50  # Neutral score

        positive_weight = sum(f.weight for f in factors if f.impact == "positive")
        negative_weight = sum(f.weight for f in factors if f.impact == "negative")
        total_weight = sum(f.weight for f in factors)

        if total_weight == 0:
            return 50

        # Score formula: positive factors increase score, negative decrease
        base_score = 50
        adjustment = ((positive_weight - negative_weight) / total_weight) * 50
        score = int(base_score + adjustment)

        # Add some randomness for mock
        score += random.randint(-5, 5)

        return max(0, min(100, score))

    def _determine_risk_level(self, score: int) -> RiskLevel:
        """Determine risk level from score"""
        if score >= 80:
            return RiskLevel.LOW
        elif score >= 60:
            return RiskLevel.MEDIUM
        elif score >= 40:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def assess_property(self, property_input: PropertyInput) -> RiskScoreResponse:
        """
        Assess risk for a property.

        In production, this would:
        1. Query external APIs for flood/environmental data
        2. Check permit databases
        3. Analyze market data
        4. Run ML model for prediction
        """
        detailed_factors: list[RiskFactor] = []

        # Select factors from each category (mock logic)
        all_categories = [
            ("Environmental", self.ENVIRONMENTAL_FACTORS),
            ("Permits", self.PERMIT_FACTORS),
            ("Market", self.MARKET_FACTORS),
            ("Structural", self.STRUCTURAL_FACTORS),
            ("Legal", self.LEGAL_FACTORS),
        ]

        for category, factors in all_categories:
            selected = self._select_factors(factors, count=random.randint(1, 2))
            for summary, impact, description in selected:
                detailed_factors.append(
                    RiskFactor(
                        category=category,
                        description=description,
                        impact=impact,
                        weight=random.uniform(0.1, 0.3),
                    )
                )

        # Calculate score
        score = self._calculate_score_from_factors(detailed_factors)
        risk_level = self._determine_risk_level(score)

        # Build summary factors list
        summary_factors = [
            f.description.split(".")[0]  # First sentence only
            for f in detailed_factors
            if f.impact in ("positive", "negative")
        ][:5]  # Top 5

        # Build full address
        full_address = f"{property_input.address}, {property_input.city}, {property_input.province}"

        return RiskScoreResponse(
            score=score,
            risk_level=risk_level,
            factors=summary_factors,
            detailed_factors=detailed_factors,
            confidence=round(random.uniform(0.75, 0.95), 2),
            property_address=full_address,
            model_version=self.model_version,
        )


# Singleton instance
risk_service = RiskAssessmentService()
