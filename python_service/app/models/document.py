from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum


class DocumentType(str, Enum):
    PURCHASE_AGREEMENT = "purchase_agreement"
    INSPECTION_REPORT = "inspection_report"
    TITLE_SEARCH = "title_search"
    MORTGAGE_COMMITMENT = "mortgage_commitment"
    STATUS_CERTIFICATE = "status_certificate"
    DISCLOSURE = "disclosure"
    OTHER = "other"


class SeverityLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class DocumentInput(BaseModel):
    """Input schema for document analysis (text mode)"""

    content: str = Field(..., description="Document text content", min_length=10)
    document_type: DocumentType = Field(default=DocumentType.OTHER)
    filename: str | None = Field(None, description="Original filename if available")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "content": "This Agreement of Purchase and Sale dated January 5, 2025...",
                    "document_type": "purchase_agreement",
                    "filename": "offer_123_queen_st.pdf"
                }
            ]
        }
    }


class RedFlag(BaseModel):
    """Individual red flag or concern found in document"""

    id: str = Field(..., description="Unique identifier for this flag")
    severity: SeverityLevel = Field(..., description="Severity level of the concern")
    title: str = Field(..., description="Brief title of the concern")
    description: str = Field(..., description="Detailed explanation")
    location: str | None = Field(None, description="Where in the document (e.g., 'Clause 12', 'Page 3')")
    recommendation: str = Field(..., description="Suggested action for the buyer")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "rf-001",
                    "severity": "warning",
                    "title": "Unusual Liability Clause",
                    "description": "Clause 12 contains an unusual liability waiver that shifts responsibility for undisclosed defects to the buyer.",
                    "location": "Clause 12, Section 12.3",
                    "recommendation": "Have your lawyer review this clause before signing. Consider negotiating standard liability terms."
                }
            ]
        }
    }


class DocumentSection(BaseModel):
    """Summary of a document section"""

    title: str = Field(..., description="Section title")
    summary: str = Field(..., description="Brief summary of this section")
    page: int | None = Field(None, description="Page number if applicable")


class DocumentAnalysisResponse(BaseModel):
    """Response schema for document analysis"""

    document_type: DocumentType = Field(..., description="Detected or provided document type")
    summary: str = Field(..., description="Overall document summary")

    # Red flags
    red_flags: list[RedFlag] = Field(default=[], description="List of concerns found")
    red_flag_count: int = Field(..., description="Total number of red flags")
    critical_count: int = Field(default=0, description="Number of critical issues")
    warning_count: int = Field(default=0, description="Number of warnings")

    # Key information extracted
    key_dates: dict[str, str] = Field(default={}, description="Important dates found (e.g., closing_date, condition_deadline)")
    key_amounts: dict[str, float] = Field(default={}, description="Important amounts found (e.g., purchase_price, deposit)")
    parties: list[str] = Field(default=[], description="Parties mentioned in the document")

    # Sections
    sections: list[DocumentSection] = Field(default=[], description="Document sections identified")

    # Metadata
    confidence: float = Field(..., ge=0, le=1, description="Model confidence in this analysis")
    model_version: str = Field(default="mock-v1.0", description="Version of the analysis model used")
    word_count: int = Field(..., description="Number of words analyzed")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "document_type": "purchase_agreement",
                    "summary": "Standard Agreement of Purchase and Sale for 123 Queen St W, Toronto. Purchase price $899,000 with 5% deposit. Closing date February 28, 2025.",
                    "red_flags": [
                        {
                            "id": "rf-001",
                            "severity": "warning",
                            "title": "Unusual Liability Clause",
                            "description": "Clause 12 contains an unusual liability waiver.",
                            "location": "Clause 12",
                            "recommendation": "Have your lawyer review this clause."
                        }
                    ],
                    "red_flag_count": 1,
                    "critical_count": 0,
                    "warning_count": 1,
                    "key_dates": {
                        "closing_date": "2025-02-28",
                        "condition_deadline": "2025-01-25"
                    },
                    "key_amounts": {
                        "purchase_price": 899000,
                        "deposit": 44950
                    },
                    "parties": ["Sarah Chen (Buyer)", "Michael Thompson (Seller)"],
                    "sections": [],
                    "confidence": 0.82,
                    "model_version": "mock-v1.0",
                    "word_count": 2450
                }
            ]
        }
    }
