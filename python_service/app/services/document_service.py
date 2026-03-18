"""
Document Analysis Service

Mock implementation of document analysis for real estate documents.
In production, this would integrate with:
- OpenAI GPT-4 for document understanding
- Custom NER models for entity extraction
- Legal clause classification models
- PDF parsing with layout understanding
"""

import random
import re
import uuid
from datetime import datetime, timedelta

from app.models.document import (
    DocumentInput,
    DocumentAnalysisResponse,
    DocumentType,
    RedFlag,
    SeverityLevel,
    DocumentSection,
)


class DocumentAnalysisService:
    """Service for analyzing real estate documents"""

    # Mock red flags by document type
    PURCHASE_AGREEMENT_FLAGS = [
        {
            "title": "Unusual Liability Clause",
            "description": "Clause 12 contains an unusual liability waiver that shifts responsibility for undisclosed defects to the buyer after closing.",
            "location": "Clause 12, Section 12.3",
            "severity": SeverityLevel.WARNING,
            "recommendation": "Have your lawyer review this clause before signing. Consider negotiating standard liability terms.",
        },
        {
            "title": "Short Condition Period",
            "description": "The financing condition period of 3 days is shorter than the standard 5-7 days, which may not provide enough time for mortgage approval.",
            "location": "Schedule A, Condition 2",
            "severity": SeverityLevel.WARNING,
            "recommendation": "Request an extension to at least 5 business days for the financing condition.",
        },
        {
            "title": "Missing Chattels List",
            "description": "The agreement does not include a detailed list of chattels (fixtures and appliances) included in the sale.",
            "location": "Schedule B",
            "severity": SeverityLevel.INFO,
            "recommendation": "Request a detailed chattels list including all appliances, window coverings, and fixtures.",
        },
        {
            "title": "Non-Standard Deposit Structure",
            "description": "Deposit is released to seller before closing, which is non-standard and increases buyer risk.",
            "location": "Clause 4.2",
            "severity": SeverityLevel.CRITICAL,
            "recommendation": "Negotiate to hold deposit in trust until closing. This is a significant red flag.",
        },
        {
            "title": "Arbitration Clause",
            "description": "Agreement contains mandatory arbitration clause that waives right to court proceedings.",
            "location": "Clause 18",
            "severity": SeverityLevel.INFO,
            "recommendation": "Understand that disputes will be resolved through arbitration rather than court.",
        },
    ]

    INSPECTION_REPORT_FLAGS = [
        {
            "title": "Roof Replacement Needed",
            "description": "Roof shows significant wear with estimated 2-3 years remaining lifespan. Replacement cost estimated at $15,000-$25,000.",
            "location": "Section 3.1 - Exterior",
            "severity": SeverityLevel.WARNING,
            "recommendation": "Request seller credit or price reduction to account for upcoming roof replacement.",
        },
        {
            "title": "Electrical Panel Concerns",
            "description": "Electrical panel is a Federal Pacific Stab-Lok model, which has known safety issues and may not be insurable.",
            "location": "Section 5.2 - Electrical",
            "severity": SeverityLevel.CRITICAL,
            "recommendation": "Budget $3,000-$5,000 for panel replacement. Check with insurance provider before proceeding.",
        },
        {
            "title": "Foundation Crack Observed",
            "description": "Hairline crack observed in basement foundation wall. Appears to be settlement crack but monitoring recommended.",
            "location": "Section 2.3 - Foundation",
            "severity": SeverityLevel.INFO,
            "recommendation": "Consider structural engineer assessment for peace of mind.",
        },
        {
            "title": "HVAC System Age",
            "description": "Furnace is 18 years old, approaching end of typical 20-year lifespan.",
            "location": "Section 6.1 - HVAC",
            "severity": SeverityLevel.INFO,
            "recommendation": "Budget for furnace replacement in next 2-5 years ($4,000-$7,000).",
        },
    ]

    STATUS_CERTIFICATE_FLAGS = [
        {
            "title": "Inadequate Reserve Fund",
            "description": "Reserve fund study indicates funding at only 65% of recommended levels. Special assessments likely.",
            "location": "Reserve Fund Study Summary",
            "severity": SeverityLevel.CRITICAL,
            "recommendation": "High risk of special assessment. Request 5-year assessment history and planned increases.",
        },
        {
            "title": "Pending Litigation",
            "description": "Corporation is involved in ongoing litigation regarding construction defects with the developer.",
            "location": "Legal Matters Section",
            "severity": SeverityLevel.WARNING,
            "recommendation": "Request full details of litigation and potential financial impact on owners.",
        },
        {
            "title": "Above-Average Maintenance Fees",
            "description": "Monthly maintenance fees of $0.85/sq ft are above the Toronto average of $0.65/sq ft.",
            "location": "Financial Summary",
            "severity": SeverityLevel.INFO,
            "recommendation": "Ensure budget accounts for higher ongoing costs. Ask about planned fee increases.",
        },
    ]

    def __init__(self):
        self.model_version = "mock-v1.0"

    def _detect_document_type(self, content: str, provided_type: DocumentType) -> DocumentType:
        """Detect document type from content if not provided"""
        if provided_type != DocumentType.OTHER:
            return provided_type

        content_lower = content.lower()

        if "agreement of purchase and sale" in content_lower or "purchase agreement" in content_lower:
            return DocumentType.PURCHASE_AGREEMENT
        elif "inspection report" in content_lower or "home inspection" in content_lower:
            return DocumentType.INSPECTION_REPORT
        elif "status certificate" in content_lower or "reserve fund" in content_lower:
            return DocumentType.STATUS_CERTIFICATE
        elif "mortgage" in content_lower and "commitment" in content_lower:
            return DocumentType.MORTGAGE_COMMITMENT
        elif "title" in content_lower and ("search" in content_lower or "insurance" in content_lower):
            return DocumentType.TITLE_SEARCH

        return DocumentType.OTHER

    def _get_flags_for_type(self, doc_type: DocumentType) -> list[dict]:
        """Get relevant red flags for document type"""
        flag_map = {
            DocumentType.PURCHASE_AGREEMENT: self.PURCHASE_AGREEMENT_FLAGS,
            DocumentType.INSPECTION_REPORT: self.INSPECTION_REPORT_FLAGS,
            DocumentType.STATUS_CERTIFICATE: self.STATUS_CERTIFICATE_FLAGS,
        }
        return flag_map.get(doc_type, self.PURCHASE_AGREEMENT_FLAGS)

    def _extract_mock_dates(self, content: str) -> dict[str, str]:
        """Extract dates from document (mock implementation)"""
        # In production, use NER or regex patterns
        today = datetime.now()
        return {
            "closing_date": (today + timedelta(days=random.randint(30, 90))).strftime("%Y-%m-%d"),
            "condition_deadline": (today + timedelta(days=random.randint(5, 14))).strftime("%Y-%m-%d"),
            "deposit_due": (today + timedelta(days=random.randint(1, 3))).strftime("%Y-%m-%d"),
        }

    def _extract_mock_amounts(self, content: str) -> dict[str, float]:
        """Extract amounts from document (mock implementation)"""
        # Look for dollar amounts in content
        amounts = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)

        base_price = random.randint(500000, 1500000)
        return {
            "purchase_price": base_price,
            "deposit": base_price * 0.05,
            "balance_due": base_price * 0.95,
        }

    def _extract_mock_parties(self, content: str) -> list[str]:
        """Extract party names from document (mock implementation)"""
        return [
            "Sarah Chen (Buyer)",
            "Michael Thompson (Seller)",
            "Royal LePage Realty (Listing Brokerage)",
        ]

    def _generate_summary(self, doc_type: DocumentType, word_count: int) -> str:
        """Generate a summary based on document type"""
        summaries = {
            DocumentType.PURCHASE_AGREEMENT: f"Standard Agreement of Purchase and Sale for residential property. Document contains {word_count} words with standard OREA clauses and schedules.",
            DocumentType.INSPECTION_REPORT: f"Comprehensive home inspection report covering structural, electrical, plumbing, and HVAC systems. Document contains {word_count} words with detailed findings.",
            DocumentType.STATUS_CERTIFICATE: f"Condominium status certificate including financial statements, reserve fund study, and corporation bylaws. Document contains {word_count} words.",
            DocumentType.MORTGAGE_COMMITMENT: f"Mortgage commitment letter outlining loan terms, conditions, and requirements. Document contains {word_count} words.",
            DocumentType.TITLE_SEARCH: f"Title search results showing property ownership history and registered interests. Document contains {word_count} words.",
            DocumentType.OTHER: f"Document analyzed containing {word_count} words. Document type could not be automatically determined.",
        }
        return summaries.get(doc_type, summaries[DocumentType.OTHER])

    def analyze_document(self, document_input: DocumentInput) -> DocumentAnalysisResponse:
        """
        Analyze a real estate document for red flags and key information.

        In production, this would:
        1. Parse PDF structure if applicable
        2. Run OCR if needed
        3. Use LLM for understanding and summarization
        4. Apply custom NER for entity extraction
        5. Run clause classification model
        """
        content = document_input.content
        word_count = len(content.split())

        # Detect document type
        doc_type = self._detect_document_type(content, document_input.document_type)

        # Get relevant flags and select random subset
        available_flags = self._get_flags_for_type(doc_type)
        num_flags = random.randint(1, min(3, len(available_flags)))
        selected_flag_data = random.sample(available_flags, num_flags)

        # Convert to RedFlag objects
        red_flags = [
            RedFlag(
                id=f"rf-{uuid.uuid4().hex[:8]}",
                severity=flag["severity"],
                title=flag["title"],
                description=flag["description"],
                location=flag["location"],
                recommendation=flag["recommendation"],
            )
            for flag in selected_flag_data
        ]

        # Count by severity
        critical_count = sum(1 for f in red_flags if f.severity == SeverityLevel.CRITICAL)
        warning_count = sum(1 for f in red_flags if f.severity == SeverityLevel.WARNING)

        # Extract information
        key_dates = self._extract_mock_dates(content)
        key_amounts = self._extract_mock_amounts(content)
        parties = self._extract_mock_parties(content)

        # Generate summary
        summary = self._generate_summary(doc_type, word_count)

        return DocumentAnalysisResponse(
            document_type=doc_type,
            summary=summary,
            red_flags=red_flags,
            red_flag_count=len(red_flags),
            critical_count=critical_count,
            warning_count=warning_count,
            key_dates=key_dates,
            key_amounts=key_amounts,
            parties=parties,
            sections=[],
            confidence=round(random.uniform(0.75, 0.92), 2),
            model_version=self.model_version,
            word_count=word_count,
        )

    def analyze_pdf(self, pdf_content: bytes, filename: str | None = None) -> DocumentAnalysisResponse:
        """
        Analyze a PDF document.

        In production, this would extract text from PDF using PyPDF2 or similar,
        then run the same analysis pipeline.
        """
        # Mock: pretend we extracted text
        mock_text = """
        Agreement of Purchase and Sale

        This agreement made as of January 5, 2025 between:

        Buyer: Sarah Chen
        Seller: Michael Thompson

        Property: 123 Queen Street West, Unit 2405, Toronto, ON M5H 2N2

        Purchase Price: $899,000
        Deposit: $44,950

        Closing Date: February 28, 2025
        Condition Deadline: January 25, 2025

        Standard OREA clauses apply with the following amendments...
        """

        return self.analyze_document(
            DocumentInput(
                content=mock_text,
                document_type=DocumentType.PURCHASE_AGREEMENT,
                filename=filename,
            )
        )


# Singleton instance
document_service = DocumentAnalysisService()
