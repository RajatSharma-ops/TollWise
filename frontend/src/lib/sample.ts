import type { PassStatus, Route, RouteSearchRequest, RouteSearchResponse, Toll } from './types'

// Illustrative data for demos and UI work while the TollGuru quota is exhausted.
// Every screen that shows it is labelled "sample data" — these are not real prices.

interface TollTemplate {
  name: string
  fee: number
  // Status the backend would report when the user has an Annual Pass.
  withPass: PassStatus
}

interface RouteTemplate {
  name: string
  km: number
  minutes: number
  tolls: TollTemplate[]
}

const DELHI_JAIPUR: RouteTemplate[] = [
  {
    name: 'via Delhi–Mumbai Expressway / NE 4',
    km: 297.4,
    minutes: 265,
    tolls: [
      { name: 'Hilalpur Toll Plaza (Delhi–Mumbai Expy)', fee: 220, withPass: 'COVERED' },
      { name: 'Bhadal Toll Plaza (NE 4)', fee: 365, withPass: 'COVERED' },
    ],
  },
  {
    name: 'via NH 48 (Delhi–Jaipur Highway)',
    km: 272.8,
    minutes: 310,
    tolls: [
      { name: 'Kherki Daula Toll Plaza', fee: 125, withPass: 'COVERED' },
      { name: 'Manoharpur Toll Plaza', fee: 150, withPass: 'COVERED' },
      { name: 'Shahjahanpur State Toll Plaza', fee: 90, withPass: 'NOT_COVERED' },
    ],
  },
  {
    name: 'via Alwar / SH 14',
    km: 305.2,
    minutes: 340,
    tolls: [
      { name: 'Sohna Toll Plaza', fee: 80, withPass: 'COVERED' },
      { name: 'Bhiwadi State Fee Plaza', fee: 100, withPass: 'NOT_COVERED' },
      { name: 'Alwar Bypass Toll', fee: 65, withPass: 'UNKNOWN' },
    ],
  },
]

function hash(text: string): number {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return Math.abs(h)
}

function title(place: string): string {
  const word = place.trim().split(/[\s,]+/)[0] ?? place
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

// Rough road distances (km) for the popular demo routes, so sample trips look plausible.
const KNOWN_KM: Record<string, number> = {
  'mumbai|pune': 150,
  'bengaluru|chennai': 345,
  'ahmedabad|vadodara': 110,
}

function genericRoutes(origin: string, destination: string): RouteTemplate[] {
  const seed = hash(`${origin.toLowerCase()}→${destination.toLowerCase()}`)
  const pair = [origin, destination].map((p) => p.trim().toLowerCase()).sort().join('|')
  const base = KNOWN_KM[pair] ?? 180 + (seed % 420)
  const a = title(origin)
  const b = title(destination)
  return [
    {
      name: 'via National Expressway',
      km: base * 1.06,
      minutes: base * 0.82,
      tolls: [
        { name: `${a} Expressway Entry Plaza`, fee: 185 + (seed % 90), withPass: 'COVERED' },
        { name: `${b} Expressway Exit Plaza`, fee: 140 + (seed % 70), withPass: 'COVERED' },
      ],
    },
    {
      name: 'via National Highway',
      km: base,
      minutes: base * 1.05,
      tolls: [
        { name: `${a} Bypass Toll Plaza`, fee: 95 + (seed % 40), withPass: 'COVERED' },
        { name: 'Midway Toll Plaza', fee: 110, withPass: 'COVERED' },
        { name: `${b} State Fee Plaza`, fee: 70 + (seed % 30), withPass: 'NOT_COVERED' },
      ],
    },
    {
      name: 'via State Highway',
      km: base * 1.12,
      minutes: base * 1.24,
      tolls: [
        { name: `${a} Ring Road Toll`, fee: 55, withPass: 'UNKNOWN' },
        { name: `${b} District Toll Gate`, fee: 60 + (seed % 25), withPass: 'NOT_COVERED' },
      ],
    },
  ]
}

function isDelhiJaipur(origin: string, destination: string): boolean {
  const pair = [origin, destination].map((p) => p.trim().toLowerCase())
  return pair.some((p) => p.includes('delhi')) && pair.some((p) => p.includes('jaipur'))
}

// Mirrors RouteController.search_routes: without a pass every plaza is
// NOT_COVERED at full price; with one, COVERED plazas drop to ₹0.
function buildRoute(t: RouteTemplate, req: RouteSearchRequest): Route {
  const tolls: Toll[] = t.tolls.map((toll) => {
    const status: PassStatus = req.annual_pass ? toll.withPass : 'NOT_COVERED'
    return {
      name: toll.name,
      normal_fee: toll.fee,
      annual_pass_status: status,
      payable_fee: status === 'COVERED' ? 0 : toll.fee,
    }
  })
  const normal = tolls.reduce((sum, x) => sum + x.normal_fee, 0)
  const payable = tolls.reduce((sum, x) => sum + x.payable_fee, 0)
  const q = (s: string) => encodeURIComponent(s)
  return {
    route_name: t.name,
    distance_km: Math.round(t.km * 10) / 10,
    duration_minutes: Math.round(t.minutes),
    normal_toll: normal,
    annual_pass_covered_amount: normal - payable,
    payable_toll: payable,
    annual_pass_savings: normal - payable,
    google_maps_url: `https://www.google.com/maps/dir/?api=1&origin=${q(req.origin)}&destination=${q(req.destination)}`,
    tolls,
  }
}

export async function sampleSearch(
  req: RouteSearchRequest,
  signal?: AbortSignal,
): Promise<RouteSearchResponse> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 650)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
  const templates = isDelhiJaipur(req.origin, req.destination)
    ? DELHI_JAIPUR
    : genericRoutes(req.origin, req.destination)
  const routes = templates.map((t) => buildRoute(t, req))
  return {
    origin: req.origin,
    destination: req.destination,
    annual_pass_applied: req.annual_pass,
    routes_count: routes.length,
    routes,
  }
}
