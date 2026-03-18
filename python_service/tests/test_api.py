"""
API Tests for EASE Intelligence Layer
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_root(self):
        """Test root endpoint returns service info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "EASE Intelligence Layer"
        assert data["status"] == "healthy"

    def test_health(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_ready(self):
        """Test readiness endpoint."""
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is True


class TestRiskScoreEndpoint:
    """Tests for /predict/risk_score endpoint."""

    def test_risk_score_basic(self):
        """Test basic risk score prediction."""
        payload = {
            "address": "123 Queen Street West",
            "city": "Toronto",
            "province": "ON",
        }
        response = client.post("/predict/risk_score", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert "score" in data
        assert 0 <= data["score"] <= 100
        assert "risk_level" in data
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert "factors" in data
        assert isinstance(data["factors"], list)
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 1

    def test_risk_score_full_payload(self):
        """Test risk score with full property details."""
        payload = {
            "address": "123 Queen Street West, Unit 2405",
            "city": "Toronto",
            "province": "ON",
            "postal_code": "M5H 2N2",
            "property_type": "condo",
            "listing_price": 899000,
            "year_built": 2019,
        }
        response = client.post("/predict/risk_score", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "123 Queen Street West" in data["property_address"]

    def test_risk_score_validation_error(self):
        """Test validation error for missing required fields."""
        payload = {"city": "Toronto"}  # Missing address
        response = client.post("/predict/risk_score", json=payload)
        assert response.status_code == 422

    def test_risk_factors_endpoint(self):
        """Test risk factors info endpoint."""
        response = client.get("/predict/risk_score/factors")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "score_interpretation" in data


class TestDocumentAnalysisEndpoint:
    """Tests for /analyze/document endpoint."""

    def test_document_analysis_basic(self):
        """Test basic document analysis."""
        payload = {
            "content": "This Agreement of Purchase and Sale is made between the buyer and seller for the property located at 123 Main Street.",
            "document_type": "purchase_agreement",
        }
        response = client.post("/analyze/document", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert "document_type" in data
        assert "summary" in data
        assert "red_flags" in data
        assert isinstance(data["red_flags"], list)
        assert "red_flag_count" in data
        assert "confidence" in data
        assert "word_count" in data

    def test_document_analysis_auto_detect_type(self):
        """Test document type auto-detection."""
        payload = {
            "content": "Home Inspection Report - Property located at 456 Oak Avenue. This comprehensive inspection covers structural, electrical, and plumbing systems.",
        }
        response = client.post("/analyze/document", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["document_type"] == "inspection_report"

    def test_document_analysis_validation_error(self):
        """Test validation error for content too short."""
        payload = {"content": "Too short"}  # Less than 10 chars
        response = client.post("/analyze/document", json=payload)
        assert response.status_code == 422

    def test_document_types_endpoint(self):
        """Test document types info endpoint."""
        response = client.get("/analyze/document/types")
        assert response.status_code == 200
        data = response.json()
        assert "supported_types" in data
        assert "severity_levels" in data


class TestRedFlagStructure:
    """Tests for red flag response structure."""

    def test_red_flag_fields(self):
        """Test that red flags have all required fields."""
        payload = {
            "content": "Agreement of Purchase and Sale with many clauses including clause 12 which states the buyer waives all rights.",
            "document_type": "purchase_agreement",
        }
        response = client.post("/analyze/document", json=payload)
        assert response.status_code == 200
        data = response.json()

        if data["red_flags"]:
            flag = data["red_flags"][0]
            assert "id" in flag
            assert "severity" in flag
            assert flag["severity"] in ["info", "warning", "critical"]
            assert "title" in flag
            assert "description" in flag
            assert "recommendation" in flag
