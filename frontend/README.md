# TollWise Frontend

React + TypeScript + Vite + Tailwind CSS web app for the TollWise API.

Users enter a start and destination, choose whether they have an NHAI Annual Pass, and compare every route TollGuru returns: distance, drive time, toll cost, how much the pass saves, a plaza-by-plaza breakdown, and a Google Maps link.

## Running it

Start the backend first (from the repo root, see the main README), then:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In development, requests to `/api/*` are proxied to the FastAPI server at `http://127.0.0.1:8000`, so no CORS setup is needed.

## Configuration

Copy `.env.example` to `.env.local` to override defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Backend URL used by the built app. Set this to the deployed API's URL for production. |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8000` | Where the dev server forwards `/api` requests. |
| `VITE_USE_SAMPLE_DATA` | `false` | Start in sample-data mode (no backend or TollGuru key needed). |

## Sample data mode

TollGuru's trial quota runs out quickly. When the API can't be reached or returns an error, the error screen offers **Show sample results instead**. You can also start in this mode with `VITE_USE_SAMPLE_DATA=true`. Sample results are clearly labelled on screen and come from `src/lib/sample.ts`; they're for demos and UI work only, not real prices.

## Structure

```
src/
├── App.tsx               # Page layout, search state, loading/error/results flow
├── lib/
│   ├── api.ts            # fetch wrappers for /routes/search and /annual-pass/status
│   ├── types.ts          # TypeScript mirrors of the backend's Pydantic DTOs
│   ├── sample.ts         # Labelled sample data for demos
│   ├── format.ts         # ₹, distance and duration formatting
│   └── hooks.ts          # Count-up numbers, scroll reveal, cursor spotlight, reduced motion
└── components/
    ├── Nav.tsx           # Floating glass nav + server/dataset status pill
    ├── SearchBar.tsx     # From/To, swap, Annual Pass switch, popular routes
    ├── RouteShow.tsx     # Animated hero scene: car passes plazas, covered ones drop to ₹0
    ├── Results.tsx       # Heading, stat tiles, sliding sort control, ticket list
    ├── Ticket.tsx        # Paper toll ticket, plaza line, stamps, itemised receipt
    ├── States.tsx        # Loading tickets, empty, error, sample-data banner
    ├── Features.tsx      # "How it works" bento grid
    ├── Marquee.tsx       # Scrolling strip of real plaza names from the NHAI PDF
    ├── Footer.tsx
    └── Logo.tsx
```

The site uses a single dark "night highway" theme with paper-ticket results. All colours are tokens at the top of `src/index.css`, and every animation turns off when the system's reduced-motion setting is on.

## Scripts

- `npm run dev`: dev server with hot reload
- `npm run build`: type-check and production build to `dist/`
- `npm run lint`: oxlint
- `npm run preview`: serve the production build locally
