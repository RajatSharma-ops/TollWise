# TollWise MVP

**TollWise** calculates exact route options and payable toll fees between any origin and destination, taking into account official NHAI Annual Pass eligibility for non-commercial private cars.

---

## 🚀 How It Works

1. **User Request**: User provides `origin`, `destination`, and `annual_pass: true | false`.
2. **Route Provider (TollGuru)**: TollWise queries TollGuru v2 API to retrieve all route alternatives, distances, durations, and toll plazas.
3. **NHAI Annual Pass Matching**: Each toll plaza is normalized and checked against the official NHAI/IHMCL Annual Pass PDF dataset.
4. **Payable Toll Calculation**:
   - `COVERED`: Payable fee is `₹0`.
   - `NOT_COVERED`: Payable fee is standard TollGuru fee.
   - `UNKNOWN`: Payable fee is standard TollGuru fee (never assumes unknown tolls are covered).
5. **Response**: TollWise returns all route options along with total normal toll, covered amount, payable toll, net savings, and individual toll statuses.

---

## 📁 Project Architecture & Structure

TollWise uses a simple feature-based FastAPI structure:

```
TollWise/
├── data/
│   ├── README.md               # Folder for NHAI Annual Pass PDF dataset
│   └── NH-Plazas.pdf           # Target PDF file provided by NHAI/IHMCL
├── src/
│   ├── annual_pass/            # Feature: NHAI Annual Pass PDF loading & plaza matching
│   │   ├── __init__.py
│   │   ├── controller.py       # Annual pass dataset loader & plaza match logic
│   │   ├── dtos.py             # Annual pass status enums & DTOs
│   │   ├── models.py           # Internal PDF plaza domain models
│   │   └── router.py           # Annual pass dataset status endpoint
│   ├── routes/                 # Feature: Route search & toll evaluation orchestration
│   │   ├── __init__.py
│   │   ├── controller.py       # Coordinates TollGuru call & Annual Pass evaluation
│   │   ├── dtos.py             # RouteSearchRequest & RouteSearchResponse schemas
│   │   ├── models.py           # Domain representations for routes & tolls
│   │   └── router.py           # FastAPI POST /routes/search endpoint
│   ├── utils/                  # Utilities
│   │   ├── __init__.py
│   │   ├── pdf_parser.py       # Extracts text/tables from NHAI PDF dynamically
│   │   ├── text_normalizer.py  # Normalizes plaza names for comparison
│   │   └── tollguru_client.py  # Async HTTP client for TollGuru API v2
│   └── __init__.py
├── main.py                     # FastAPI application initialization & router mounting
├── docker/                     # Docker setup files
├── docker-compose.yml          # Docker compose file
├── .env                        # Local environment variables
├── .env.example                # Example environment variables template
├── .gitignore                  # Git ignore file
├── README.md                   # Project documentation
└── requirements.txt            # Python dependencies
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Python 3.10+
- TollGuru API Key (Get from [TollGuru API Docs](https://tollguru.com/toll-api-docs))

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your TollGuru API key:

```bash
cp .env.example .env
```

Edit `.env`:
```ini
TOLLGURU_API_KEY=your_actual_tollguru_api_key
NHAI_PDF_PATH=data/nhai_annual_pass.pdf
HOST=0.0.0.0
PORT=8000
```

### 3. Add NHAI Annual Pass PDF
Place your official NHAI/IHMCL Annual Pass PDF inside the `data/` folder:
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

Start the FastAPI development server:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

or run Python directly:

```bash
python main.py
```

### Option B: Docker & Docker Compose

Run using Docker Compose:

```bash
# Build and start container
docker-compose up --build

# Run in background (detached mode)
docker-compose up -d
```

Or build and run directly with Docker CLI:

```bash
# Build Docker image using the docker/Dockerfile
docker build -f docker/Dockerfile -t tollwise-api .

# Run Docker container with environment file
docker run -p 8000:8000 --env-file .env tollwise-api
```

The API will be available at:
- **Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

## 📡 API Endpoint Reference

### Search Routes with Annual Pass Savings

- **URL**: `http://127.0.0.1:8000/routes/search`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Example Request
```json
{
  "origin": "Delhi",
  "destination": "Jaipur",
  "annual_pass": true
}
```

#### Example Response
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

## 💡 Annual Pass Calculation Rules

| `annual_pass` Input | Toll Plaza Status in PDF | Assigned Status | Payable Fee |
| :--- | :--- | :--- | :--- |
| `false` | Any | `NOT_COVERED` | Normal Fee |
| `true` | Found in NHAI PDF | `COVERED` | **₹0** |
| `true` | Not found in NHAI PDF | `NOT_COVERED` | Normal Fee |
| `true` | PDF unreadable / ambiguous | `UNKNOWN` | Normal Fee |
