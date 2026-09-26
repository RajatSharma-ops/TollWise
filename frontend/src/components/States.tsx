import { useState } from 'react'
import { CloudOff, FlaskConical, KeyRound, RotateCw, SearchX, TriangleAlert } from 'lucide-react'
import { ApiError } from '../lib/api'

export function LoadingTickets() {
  return (
    <div aria-busy="true" aria-label="Loading routes">
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-glow uppercase">
        <span className="size-1.5 animate-ping rounded-full bg-glow" />
        Checking every plaza on every route
      </p>
      <div className="mt-6 grid gap-7">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col opacity-80 md:flex-row" style={{ opacity: 0.85 - i * 0.2 }}>
            <div className="paper notch-b md:notch-r flex-1 space-y-4 rounded-t-[22px] p-7 md:rounded-l-[22px] md:rounded-tr-none">
              <div className="shimmer h-3 w-28 rounded" />
              <div className="shimmer h-7 w-2/3 rounded" />
              <div className="shimmer h-3 w-1/2 rounded" />
              <div className="shimmer mt-6 h-2 w-full rounded" />
            </div>
            <div className="paper notch-t md:notch-l space-y-3 rounded-b-[22px] border-t-2 border-dashed border-paper-line p-7 md:w-64 md:rounded-r-[22px] md:rounded-bl-none md:border-t-0 md:border-l-2">
              <div className="shimmer h-3 w-16 rounded" />
              <div className="shimmer h-11 w-32 rounded" />
              <div className="shimmer mt-6 h-11 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NoRoutes() {
  return (
    <div className="glass rounded-3xl px-6 py-14 text-center">
      <SearchX className="mx-auto size-8 text-dim" />
      <h2 className="mt-4 text-2xl font-semibold">No routes found</h2>
      <p className="mx-auto mt-2 max-w-sm text-dim">Try a more specific place name, like a city with its state.</p>
    </div>
  )
}

const ERROR_COPY = {
  network: {
    Icon: CloudOff,
    hint: 'Make sure the backend is running (uvicorn main:app --port 8000), then try again.',
  },
  config: {
    Icon: KeyRound,
    hint: 'Check that TOLLGURU_API_KEY is set in the backend’s .env file.',
  },
  provider: {
    Icon: TriangleAlert,
    hint: 'TollGuru may be rate-limiting us or couldn’t understand these places. Try again shortly, or use more specific names.',
  },
  server: {
    Icon: TriangleAlert,
    hint: 'This one is on our side. Try again in a moment.',
  },
}

interface ErrorProps {
  error: ApiError
  onRetry: () => void
  onUseSample: () => void
}

export function ErrorPanel({ error, onRetry, onUseSample }: ErrorProps) {
  const [showDetail, setShowDetail] = useState(false)
  const { Icon, hint } = ERROR_COPY[error.kind]
  return (
    <div role="alert" className="glass relative overflow-hidden rounded-3xl p-7 sm:p-10">
      <div className="absolute -top-24 -right-24 size-64 rounded-full bg-coral/15 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-coral/30 bg-coral/10 text-coral">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">{error.message}</h2>
          <p className="mt-2 text-dim">{hint}</p>
          {error.detail && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetail(!showDetail)}
                className="font-mono text-[11px] tracking-wider text-dim uppercase underline underline-offset-4 hover:text-fg"
              >
                {showDetail ? 'Hide' : 'Show'} technical details
              </button>
              {showDetail && (
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-edge bg-bg/60 p-3 font-mono text-xs break-all whitespace-pre-wrap text-dim">
                  {error.detail}
                </pre>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-white"
            >
              <RotateCw className="size-4" />
              Try again
            </button>
            <button
              type="button"
              onClick={onUseSample}
              className="inline-flex items-center gap-2 rounded-full border border-edge px-5 py-2.5 text-sm font-semibold transition hover:border-amber/50 hover:text-amber"
            >
              <FlaskConical className="size-4" />
              Show sample results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SampleBanner({ onGoLive }: { onGoLive: () => void }) {
  return (
    <div className="mb-8 flex flex-col gap-2 rounded-2xl border border-amber/30 bg-amber/[0.07] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2.5">
        <FlaskConical className="size-4 shrink-0 text-amber" />
        <span>
          <strong className="font-semibold text-amber">Sample data.</strong>{' '}
          <span className="text-dim">These routes and prices are illustrative, not live from TollGuru.</span>
        </span>
      </p>
      <button
        type="button"
        onClick={onGoLive}
        className="self-start font-mono text-[11px] tracking-wider text-amber uppercase underline-offset-4 hover:underline sm:self-auto"
      >
        Switch to live
      </button>
    </div>
  )
}
