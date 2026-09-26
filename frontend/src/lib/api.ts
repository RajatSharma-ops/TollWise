import type { DatasetStatus, RouteSearchRequest, RouteSearchResponse } from './types'

// In dev the Vite proxy maps /api -> the FastAPI server (see vite.config.ts).
// For a deployed build, set VITE_API_BASE_URL to the backend's public URL.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export type ApiErrorKind = 'network' | 'config' | 'provider' | 'server'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly detail: string | null

  constructor(kind: ApiErrorKind, message: string, detail: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.detail = detail
  }
}

async function readDetail(res: Response): Promise<string | null> {
  try {
    const body = await res.json()
    return typeof body?.detail === 'string' ? body.detail : null
  } catch {
    return null
  }
}

export async function searchRoutes(
  req: RouteSearchRequest,
  signal?: AbortSignal,
): Promise<RouteSearchResponse> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/routes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('network', "We couldn't reach the TollWise server.")
  }

  if (res.ok) return res.json()

  const detail = await readDetail(res)

  // A proxy/gateway failure (backend not running) comes back without FastAPI's
  // JSON `detail`, so treat a detail-less 5xx as "server unreachable".
  if (detail === null && res.status >= 500) {
    throw new ApiError('network', "We couldn't reach the TollWise server.")
  }
  if (res.status === 400) {
    throw new ApiError('config', 'The server is missing its toll pricing setup.', detail)
  }
  if (res.status === 422) {
    throw new ApiError('config', 'Please enter both a starting point and a destination.', detail)
  }
  if (res.status === 502) {
    throw new ApiError('provider', "The routing provider couldn't return routes for this trip.", detail)
  }
  throw new ApiError('server', 'Something went wrong on the server.', detail)
}

export async function getDatasetStatus(signal?: AbortSignal): Promise<DatasetStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/annual-pass/status`, { signal })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
