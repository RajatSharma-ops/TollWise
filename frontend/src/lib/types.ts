// Mirrors the Pydantic DTOs in src/routes/dtos.py and src/annual_pass/dtos.py.

export type PassStatus = 'COVERED' | 'NOT_COVERED' | 'UNKNOWN'

export interface Toll {
  name: string
  normal_fee: number
  annual_pass_status: PassStatus
  payable_fee: number
}

export interface Route {
  route_name: string
  distance_km: number
  duration_minutes: number
  normal_toll: number
  annual_pass_covered_amount: number
  payable_toll: number
  annual_pass_savings: number
  google_maps_url: string | null
  tolls: Toll[]
}

export interface RouteSearchRequest {
  origin: string
  destination: string
  annual_pass: boolean
}

export interface RouteSearchResponse {
  origin: string
  destination: string
  annual_pass_applied: boolean
  routes_count: number
  routes: Route[]
}

export interface DatasetStatus {
  dataset_loaded: boolean
  eligible_plazas_count: number
  pdf_path: string
}
