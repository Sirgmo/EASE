"""
EASE Intelligence Layer

FastAPI backend service providing AI-powered analysis for real estate transactions.

Endpoints:
- /predict/risk_score - Property risk assessment
- /analyze/document - Document red flag detection
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predict_router, analyze_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("🚀 EASE Intelligence Layer starting up...")
    print("📊 Loading models...")
    # In production: load ML models here
    yield
    # Shutdown
    print("👋 EASE Intelligence Layer shutting down...")


app = FastAPI(
    title="EASE Intelligence Layer",
    description="""
## AI-Powered Real Estate Transaction Analysis

The EASE Intelligence Layer provides machine learning and AI capabilities
for analyzing real estate transactions, properties, and documents.

### Features

* **Risk Assessment** - Analyze properties for potential risks using multiple data sources
* **Document Analysis** - Extract key information and red flags from legal documents
* **Market Intelligence** - (Coming soon) Market trends and pricing analysis

### Authentication

Currently running in development mode. Production deployment will require API key authentication.

### Rate Limits

- Development: Unlimited
- Production: 100 requests/minute per API key
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",
        "https://ease.app",  # Production domain (placeholder)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict_router)
app.include_router(analyze_router)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - service information."""
    return {
        "service": "EASE Intelligence Layer",
        "version": "1.0.0",
        "status": "healthy",
        "documentation": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for container orchestration."""
    return {
        "status": "healthy",
        "services": {
            "risk_assessment": "operational",
            "document_analysis": "operational",
        }
    }


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check - indicates if service is ready to accept traffic."""
    # In production, check database connections, model loading, etc.
    return {
        "ready": True,
        "models_loaded": True,
        "database_connected": False,  # Not implemented yet
    }
