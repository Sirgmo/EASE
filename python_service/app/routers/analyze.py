"""
Document Analysis Endpoints

Endpoints for analyzing real estate documents including
purchase agreements, inspection reports, and status certificates.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from app.models.document import (
    DocumentInput,
    DocumentAnalysisResponse,
    DocumentType,
)
from app.services.document_service import document_service

router = APIRouter(prefix="/analyze", tags=["Document Analysis"])


@router.post(
    "/document",
    response_model=DocumentAnalysisResponse,
    summary="Analyze a document for red flags",
    description="""
    Analyze a real estate document and extract key information, dates, amounts,
    and identify potential red flags or concerns.

    Supported document types:
    - **purchase_agreement**: Agreement of Purchase and Sale
    - **inspection_report**: Home inspection reports
    - **status_certificate**: Condo status certificates
    - **mortgage_commitment**: Mortgage approval letters
    - **title_search**: Title search results
    - **disclosure**: Seller disclosure statements
    - **other**: Any other document

    The analysis returns:
    - Summary of the document
    - Red flags with severity levels (info, warning, critical)
    - Key dates extracted (closing, conditions, etc.)
    - Key amounts (purchase price, deposit, etc.)
    - Parties mentioned
    """,
    responses={
        200: {
            "description": "Successful document analysis",
            "content": {
                "application/json": {
                    "example": {
                        "document_type": "purchase_agreement",
                        "summary": "Standard Agreement of Purchase and Sale for 123 Queen St W, Toronto.",
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
                        "confidence": 0.85,
                        "word_count": 2450
                    }
                }
            }
        },
        422: {"description": "Validation error in request body"},
    }
)
async def analyze_document(document_input: DocumentInput) -> DocumentAnalysisResponse:
    """
    Analyze a real estate document provided as text.

    - **content**: The document text content (minimum 10 characters)
    - **document_type**: Type of document (optional, will be auto-detected)
    - **filename**: Original filename if available
    """
    try:
        return document_service.analyze_document(document_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")


@router.post(
    "/document/upload",
    response_model=DocumentAnalysisResponse,
    summary="Upload and analyze a PDF document",
    description="""
    Upload a PDF document for analysis. The system will extract text
    and analyze it for red flags and key information.

    Maximum file size: 10MB
    Supported formats: PDF
    """,
)
async def analyze_document_upload(
    file: UploadFile = File(..., description="PDF file to analyze"),
    document_type: Optional[DocumentType] = Form(
        default=DocumentType.OTHER,
        description="Type of document (optional, will be auto-detected)"
    ),
) -> DocumentAnalysisResponse:
    """
    Upload a PDF document for analysis.

    The document will be parsed, text extracted, and analyzed
    for red flags and key information.
    """
    # Validate file type
    if file.content_type not in ["application/pdf", "application/octet-stream"]:
        # Also accept text files for testing
        if file.content_type not in ["text/plain"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only PDF files are supported."
            )

    # Check file size (10MB limit)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    try:
        # For PDF files, use the PDF analyzer
        if file.content_type == "application/pdf":
            return document_service.analyze_pdf(contents, file.filename)

        # For text files, decode and analyze
        text_content = contents.decode("utf-8")
        return document_service.analyze_document(
            DocumentInput(
                content=text_content,
                document_type=document_type,
                filename=file.filename,
            )
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Could not decode file. Please ensure it's a valid PDF or text file."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")


@router.get(
    "/document/types",
    summary="Get supported document types",
    description="Returns the list of document types supported for analysis."
)
async def get_document_types() -> dict:
    """Get information about supported document types."""
    return {
        "supported_types": [
            {
                "type": "purchase_agreement",
                "name": "Agreement of Purchase and Sale",
                "description": "Standard real estate purchase contracts",
                "common_red_flags": ["Unusual clauses", "Short condition periods", "Non-standard deposits"]
            },
            {
                "type": "inspection_report",
                "name": "Home Inspection Report",
                "description": "Professional home inspection findings",
                "common_red_flags": ["Structural issues", "Electrical concerns", "Roof/foundation problems"]
            },
            {
                "type": "status_certificate",
                "name": "Condominium Status Certificate",
                "description": "Condo corporation financial and legal status",
                "common_red_flags": ["Low reserve fund", "Pending litigation", "Special assessments"]
            },
            {
                "type": "mortgage_commitment",
                "name": "Mortgage Commitment Letter",
                "description": "Lender's mortgage approval documentation",
                "common_red_flags": ["Unusual conditions", "Rate lock expiry", "Missing insurance requirements"]
            },
            {
                "type": "title_search",
                "name": "Title Search Results",
                "description": "Property ownership and encumbrance records",
                "common_red_flags": ["Liens", "Easements", "Boundary disputes"]
            },
            {
                "type": "disclosure",
                "name": "Seller Disclosure Statement",
                "description": "Seller's property condition disclosure",
                "common_red_flags": ["Known defects", "Insurance claims", "Neighbor disputes"]
            }
        ],
        "severity_levels": {
            "info": "Informational - worth noting but not a concern",
            "warning": "Warning - should be reviewed carefully",
            "critical": "Critical - requires immediate attention"
        }
    }
