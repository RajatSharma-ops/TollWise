# TollWise MVP

**TollWise** calculates exact route options and payable toll fees between any origin and destination, evaluating official **NHAI Annual Pass** eligibility for private non-commercial cars.

---

## 🚀 How It Works

1. **User Input**: User submits `origin`, `destination`, and `annual_pass: true | false`.
2. **Route Provider (TollGuru)**: TollWise queries the TollGuru API to retrieve all route alternatives (e.g. 3 routes for Delhi → Jaipur), including distance, duration, toll plazas, and standard fees.
3. **Plaza Matching**: Each toll plaza is normalized and evaluated independently against the official NHAI Annual Pass PDF dataset.
4. **Payable Toll Calculation**:
   - `COVERED`: Plaza confidently matched with NHAI dataset ➔ Payable fee = **₹0** (when `annual_pass: true`).
   - `NOT_COVERED`: Plaza confidently determined not covered ➔ Payable fee = **Standard TollGuru Fee**.
   - `UNKNOWN`: Plaza match cannot be established confidently ➔ Payable fee = **Standard TollGuru Fee** *(Never treated as COVERED)*.
5. **Multi-Route Response**: TollWise preserves **all route alternatives** (does not select or filter down to a single route) and returns calculated totals, savings, per-toll statuses, and Google Maps navigation URLs for each route.

---

## 📁 Project Architecture & Structure

```
TollWise/
├── data/
│   ├── README.md               # Instructions for dataset placement
│   └── nhai_annual_pass.pdf    # Official NHAI/IHMCL Annual Pass eligible plaza PDF
├── src/
│   ├── annual_pass/            # Feature: Annual Pass PDF loading & plaza evaluation
│   │   ├── __init__.py
│   │   ├── controller.py       # Dataset loader & plaza matching logic
│   │   ├── dtos.py             # Status enums (COVERED, NOT_COVERED, UNKNOWN)
│   │   ├── models.py           # Internal PDF plaza domain model
│   │   └── router.py           # GET /annual-pass/status endpoint
│   ├── routes/                 # Feature: Route search & toll orchestration
│   │   ├── __init__.py
│   │   ├── controller.py       # Orchestrates TollGuru response & Annual Pass evaluation
│   │   ├── dtos.py             # RouteSearchRequest & RouteSearchResponse schemas
│   │   ├── models.py           # Internal route & toll domain data containers
│   │   └── router.py           # POST /routes/search endpoint
│   ├── utils/                  # Shared Utilities
│   │   ├── __init__.py
│   │   ├── pdf_parser.py       # Dynamic text/table extractor for PDF
│   │   ├── text_normalizer.py  # Plaza name string normalizer
│   │   └── tollguru_client.py  # Async HTTP client for TollGuru API v2
│   └── __init__.py
├── docker/
│   └── Dockerfile              # Container build definition
├── .dockerignore               # Docker ignore rules
├── .env                        # Local environment variables (TOLLGURU_API_KEY, NHAI_PDF_PATH)
├── .env.example                # Template environment variables
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Docker compose orchestration
├── main.py                     # FastAPI app entry point (root)
├── README.md                   # Project documentation
└── requirements.txt            # Minimal Python dependencies
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Python 3.10+
- TollGuru API Key (Get from [TollGuru API Docs](https://tollguru.com/toll-api-docs))

### 2. Environment Configuration
Copy `.env.example` to `.env` and enter your TollGuru API key:

```bash
cp .env.example .env
```

Edit `.env`:
```ini
TOLLGURU_API_KEY=your_actual_tollguru_api_key
NHAI_PDF_PATH=data/nhai_annual_pass.pdf
HOST=127.0.0.1
PORT=8000
```

### 3. Add NHAI Annual Pass PDF
Ensure your official NHAI Annual Pass PDF is placed at:
```bash
data/nhai_annual_pass.pdf
```

### 4. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🏃 Running the Application

### Option A: Local Python Environment
```bash
# Start server using Uvicorn
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Or run Python directly
python main.py
```

### Option B: Docker & Docker Compose
```bash
# Using Docker Compose
docker-compose up --build

# Or using Docker CLI
docker build -f docker/Dockerfile -t tollwise-api .
docker run -p 8000:8000 --env-file .env tollwise-api
```

The API will be available at:
- **Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

## 📡 API Endpoint Reference

### POST `/routes/search`

- **URL**: `http://127.0.0.1:8000/routes/search`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "origin": "Delhi",
  "destination": "Jaipur",
  "annual_pass": true
}
```

#### Response Example (3 Route Alternatives Returned)
```json
{
  "origin": "Delhi",
  "destination": "Jaipur",
  "annual_pass_applied": true,
  "routes_count": 3,
  "routes": [
    {
      "route_name": "via Delhi - Mumbai Expy / NE 4 (Fastest)",
      "distance_km": 297.4,
      "duration_minutes": 265.0,
      "normal_toll": 585.0,
      "annual_pass_covered_amount": 585.0,
      "payable_toll": 0.0,
      "annual_pass_savings": 585.0,
      "google_maps_url": "https://www.google.com/maps/dir/?api=1&origin=Delhi&destination=Jaipur",
      "tolls": [
        {
          "name": "Hilalpur Toll Plaza (Delhi-Mumbai Expy)",
          "normal_fee": 220.0,
          "annual_pass_status": "COVERED",
          "payable_fee": 0.0
        },
        {
          "name": "Bhadal Toll Plaza (NE 4)",
          "normal_fee": 365.0,
          "annual_pass_status": "COVERED",
          "payable_fee": 0.0
        }
      ]
    },
    {
      "route_name": "via NH 48 (Delhi - Jaipur Highway)",
      "distance_km": 272.8,
      "duration_minutes": 310.0,
      "normal_toll": 215.0,
      "annual_pass_covered_amount": 125.0,
      "payable_toll": 90.0,
      "annual_pass_savings": 125.0,
      "google_maps_url": "https://www.google.com/maps/dir/?api=1&origin=Delhi&destination=Jaipur",
      "tolls": [
        {
          "name": "Kherki Daula Toll Plaza",
          "normal_fee": 125.0,
          "annual_pass_status": "COVERED",
          "payable_fee": 0.0
        },
        {
          "name": "Shahjahanpur State Toll Plaza",
          "normal_fee": 90.0,
          "annual_pass_status": "NOT_COVERED",
          "payable_fee": 90.0
        }
      ]
    },
    {
      "route_name": "via Alwar / SH 14",
      "distance_km": 305.2,
      "duration_minutes": 340.0,
      "normal_toll": 180.0,
      "annual_pass_covered_amount": 80.0,
      "payable_toll": 100.0,
      "annual_pass_savings": 80.0,
      "google_maps_url": "https://www.google.com/maps/dir/?api=1&origin=Delhi&destination=Jaipur",
      "tolls": [
        {
          "name": "Sohna Toll Plaza",
          "normal_fee": 80.0,
          "annual_pass_status": "COVERED",
          "payable_fee": 0.0
        },
        {
          "name": "Bhiwadi State Fee Plaza",
          "normal_fee": 100.0,
          "annual_pass_status": "NOT_COVERED",
          "payable_fee": 100.0
        }
      ]
    }
  ]
}
```

---

## 💡 Annual Pass Calculation & Matching Statuses

| Status | Definition | Payable Fee when `annual_pass: true` |
| :--- | :--- | :--- |
| **`COVERED`** | Confidently matched with NHAI Annual Pass dataset | **₹0.0** |
| **`NOT_COVERED`** | Confidently determined NOT to be eligible/covered | Standard TollGuru Fee |
| **`UNKNOWN`** | Match cannot be established confidently *(Never treated as COVERED)* | Standard TollGuru Fee |

### Key Business Logic Principles:
- When `annual_pass: false`, all tolls are assigned standard TollGuru fees regardless of dataset matching.
- When `annual_pass: true`, eligibility is checked plaza-by-plaza.
- For routes where all toll plazas match the NHAI dataset (e.g. Delhi-Mumbai Expressway route), the total payable toll becomes **₹0**.
- TollWise returns **all route alternatives** and does not filter out or hide any route.

---

## 📍 Google Maps Navigation Link Note

TollWise extracts and exposes the `google_maps_url` for each route returned by TollGuru (or generates a direct Google Maps Directions URL fallback).

> **Verification Note**: The `google_maps_url` field is fully implemented in the response DTO and controller logic. However, manual end-to-end click-through testing in an external browser remains pending after the TollGuru API trial quota was exhausted during API integration testing.

---

## ✅ Verification & Testing Status

| Component / Feature | Status | Notes |
| :--- | :--- | :--- |
| **TollGuru API Integration** | **VERIFIED** | Successfully queries TollGuru v2 origin-destination API |
| **Multi-Route Alternatives** | **VERIFIED** | Preserves and returns all 3 route alternatives for Delhi → Jaipur |
| **Distance & Duration Parsing** | **VERIFIED** | Correctly parses numeric values from text/metric objects |
| **Annual Pass OFF (`annual_pass: false`)** | **VERIFIED** | Standard TollGuru fees returned for all plazas |
| **Annual Pass ON (`annual_pass: true`)** | **VERIFIED** | Covered plazas set to ₹0 fee, non-covered plazas retain standard fee |
| **NHAI PDF Dataset Parsing** | **VERIFIED** | Dynamically parses eligible plaza list from `data/nhai_annual_pass.pdf` |
| **Google Maps URL Field** | **IMPLEMENTED** | Included in DTO response; manual click verification pending API quota |
