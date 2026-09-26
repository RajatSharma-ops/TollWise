# TollWise MVP

**TollWise** calculates exact route options and payable toll fees between any origin and destination, evaluating official **NHAI Annual Pass** eligibility for private non-commercial cars.

---

## 🚀 How It Works

1. **User Input**: User submits `origin`, `destination`, and `annual_pass: true | false` via the web application or REST API.
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
│   └── NH-Plazas.pdf           # Official NHAI/IHMCL Annual Pass eligible plaza PDF
├── frontend/                   # React + Vite Frontend Web App
│   ├── public/                 # Static assets
│   ├── src/                    # Components (RouteShow, Ticket, SearchBar, etc.)
│   ├── .env.example            # Frontend environment variables template
│   ├── package.json            # Node.js dependencies & scripts
│   └── vite.config.ts          # Vite configuration with API proxying to backend
├── src/                        # FastAPI Backend Application
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
- Node.js 20+ and npm
- TollGuru API Key (Get from [TollGuru API Docs](https://tollguru.com/toll-api-docs))

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root directory and set your TollGuru API key:

```bash
cp .env.example .env
```

Edit `.env`:
```ini
TOLLGURU_API_KEY=your_actual_tollguru_api_key
NHAI_PDF_PATH=data/NH-Plazas.pdf
HOST=127.0.0.1
PORT=8000
```

### 3. Add NHAI Annual Pass PDF
Ensure your official NHAI Annual Pass PDF is placed at:
```bash
data/NH-Plazas.pdf
```

### 4. Install Dependencies

#### Backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

---

## 🏃 Running the Application

To run the complete application, start both the backend and frontend servers:

### 1. Start the Backend Server (FastAPI)
```bash
# Activate virtual environment if not already activated
source venv/bin/activate

# Run Uvicorn server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- **Base API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Dev Server (Vite)
In a separate terminal window:
```bash
cd frontend
npm run dev
```
- **Frontend App URL**: `http://localhost:5173`
- The dev server automatically proxies `/api/*` HTTP requests to `http://127.0.0.1:8000`.

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
      "route_name": "Bandikui Jaipur Expressway",
      "distance_km": 297.68,
      "duration_minutes": 209.33,
      "normal_toll": 615.0,
      "annual_pass_covered_amount": 615.0,
      "payable_toll": 0.0,
      "annual_pass_savings": 615.0,
      "google_maps_url": "https://www.google.com/maps/?saddr=...",
      "tolls": [
        {
          "name": "Ghamroj",
          "normal_fee": 135.0,
          "annual_pass_status": "COVERED",
          "payable_fee": 0.0
        },
        {
          "name": "Main Toll Plaza (Hilalpur)",
          "normal_fee": 330.0,
          "annual_pass_status": "COVERED",
          "payable_fee": 0.0
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
- For routes where all toll plazas match the NHAI dataset, the total payable toll becomes **₹0**.
- TollWise returns **all route alternatives** and does not filter out or hide any route.

---

## ✅ Verification & Testing Status

| Component / Feature | Status | Notes |
| :--- | :--- | :--- |
| **Backend API (FastAPI)** | **VERIFIED** | Successfully responds on `http://127.0.0.1:8000` |
| **Frontend UI (Vite + React)** | **VERIFIED** | Interactive route search app running at `http://localhost:5173` |
| **TollGuru API Integration** | **VERIFIED** | Successfully queries TollGuru v2 origin-destination API |
| **Multi-Route Alternatives** | **VERIFIED** | Preserves and returns all route alternatives for search requests |
| **Distance & Duration Parsing** | **VERIFIED** | Correctly parses numeric values from text/metric objects |
| **Annual Pass OFF (`annual_pass: false`)** | **VERIFIED** | Standard TollGuru fees returned for all plazas |
| **Annual Pass ON (`annual_pass: true`)** | **VERIFIED** | Covered plazas set to ₹0 fee, non-covered plazas retain standard fee |
| **NHAI PDF Dataset Parsing** | **VERIFIED** | Dynamically parses eligible plaza list from `data/NH-Plazas.pdf` |
