# EASE Intelligence Layer

AI-powered backend service for the EASE real estate platform.

## Features

- **Property Risk Assessment** (`/predict/risk_score`) - Analyze properties for potential risks
- **Document Analysis** (`/analyze/document`) - Extract red flags from real estate documents

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Build and run
docker-compose up --build

# Or just build
docker build -t ease-intelligence .
docker run -p 8000:8000 ease-intelligence
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Health Checks

```bash
GET /          # Service info
GET /health    # Health check
GET /ready     # Readiness check
```

### Risk Assessment

```bash
POST /predict/risk_score
```

Request:
```json
{
  "address": "123 Queen Street West, Unit 2405",
  "city": "Toronto",
  "province": "ON",
  "postal_code": "M5H 2N2",
  "property_type": "condo",
  "listing_price": 899000,
  "year_built": 2019
}
```

Response:
```json
{
  "score": 85,
  "risk_level": "LOW",
  "factors": [
    "Flood zone negative",
    "Permit history clear",
    "Market volatility stable"
  ],
  "detailed_factors": [...],
  "confidence": 0.87,
  "property_address": "123 Queen Street West, Unit 2405, Toronto, ON",
  "model_version": "mock-v1.0"
}
```

### Document Analysis

```bash
POST /analyze/document
```

Request:
```json
{
  "content": "Agreement of Purchase and Sale...",
  "document_type": "purchase_agreement",
  "filename": "offer.pdf"
}
```

Response:
```json
{
  "document_type": "purchase_agreement",
  "summary": "Standard Agreement of Purchase and Sale...",
  "red_flags": [
    {
      "id": "rf-001",
      "severity": "warning",
      "title": "Unusual Liability Clause",
      "description": "Clause 12 contains an unusual liability waiver...",
      "location": "Clause 12",
      "recommendation": "Have your lawyer review this clause."
    }
  ],
  "red_flag_count": 1,
  "key_dates": {"closing_date": "2025-02-28"},
  "key_amounts": {"purchase_price": 899000},
  "confidence": 0.85
}
```

## Testing

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html
```

## Project Structure

```
python_service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models/              # Pydantic models
│   │   ├── risk.py
│   │   └── document.py
│   ├── routers/             # API routes
│   │   ├── predict.py
│   │   └── analyze.py
│   └── services/            # Business logic
│       ├── risk_service.py
│       └── document_service.py
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── pyproject.toml
```

## Future Enhancements

- [ ] OpenAI integration for document understanding
- [ ] PostgreSQL database for caching results
- [ ] Redis for rate limiting
- [ ] External API integrations (flood zones, permits)
- [ ] ML model training pipeline
