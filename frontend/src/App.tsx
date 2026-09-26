import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, getDatasetStatus, searchRoutes } from './lib/api'
import { sampleSearch } from './lib/sample'
import type { DatasetStatus, RouteSearchRequest, RouteSearchResponse } from './lib/types'
import { Features } from './components/Features'
import { Footer } from './components/Footer'
import { Marquee } from './components/Marquee'
import { Nav } from './components/Nav'
import { Results } from './components/Results'
import { RouteShow } from './components/RouteShow'
import { SearchBar } from './components/SearchBar'
import { ErrorPanel, LoadingTickets, NoRoutes, SampleBanner } from './components/States'

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'done'; data: RouteSearchResponse }

const START_IN_SAMPLE_MODE = import.meta.env.VITE_USE_SAMPLE_DATA === 'true'

export default function App() {
  const [query, setQuery] = useState<RouteSearchRequest>({
    origin: '',
    destination: '',
    annual_pass: true,
  })
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [sampleMode, setSampleMode] = useState(START_IN_SAMPLE_MODE)
  const [dataset, setDataset] = useState<DatasetStatus | null | undefined>(undefined)

  const lastRequest = useRef<RouteSearchRequest | null>(null)
  const inFlight = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    getDatasetStatus(ctrl.signal).then((status) => {
      if (!ctrl.signal.aborted) setDataset(status)
    })
    return () => ctrl.abort()
  }, [])

  const run = useCallback(
    async (req: RouteSearchRequest, useSample = sampleMode) => {
      inFlight.current?.abort()
      const ctrl = new AbortController()
      inFlight.current = ctrl
      lastRequest.current = req
      setPhase({ kind: 'loading' })
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: 'start' }))
      try {
        const search = useSample ? sampleSearch : searchRoutes
        const data = await search(req, ctrl.signal)
        setPhase({ kind: 'done', data })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const error = err instanceof ApiError ? err : new ApiError('server', 'Something went wrong.')
        setPhase({ kind: 'error', error })
      }
    },
    [sampleMode],
  )

  // Flipping the pass switch after a search re-prices the same trip.
  function changePass(value: boolean) {
    setQuery((q) => ({ ...q, annual_pass: value }))
    if (phase.kind === 'done' && lastRequest.current) {
      run({ ...lastRequest.current, annual_pass: value })
    }
  }

  function switchSampleMode(on: boolean) {
    setSampleMode(on)
    if (lastRequest.current) run(lastRequest.current, on)
  }

  return (
    <div id="top">
      <div className="backdrop" aria-hidden="true" />
      <Nav dataset={dataset} sampleMode={sampleMode} />

      <header className="mx-auto max-w-6xl px-4 pt-32 text-center sm:px-6 sm:pt-40">
        <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-edge bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-wider text-dim uppercase">
          <span className="size-1.5 rounded-full bg-amber shadow-[0_0_10px_var(--amber)]" />
          NHAI Annual Pass aware
        </p>
        <h1
          className="animate-rise mx-auto mt-6 max-w-4xl text-[clamp(2.8rem,8vw,6.2rem)] leading-[0.95] font-semibold tracking-[-0.045em] text-balance"
          style={{ animationDelay: '80ms' }}
        >
          Every toll, <span className="accent-word">priced</span> before you drive.
        </h1>
        <p
          className="animate-rise mx-auto mt-6 max-w-xl text-lg text-pretty text-dim"
          style={{ animationDelay: '160ms' }}
        >
          Compare every route between two places, see what each plaza will charge, and find out
          exactly how much your Annual Pass saves.
        </p>

        <div className="animate-rise mx-auto mt-10 max-w-5xl" style={{ animationDelay: '240ms' }}>
          <SearchBar
            value={query}
            loading={phase.kind === 'loading'}
            onChange={setQuery}
            onPassChange={changePass}
            onSearch={(req) => run(req)}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <div ref={resultsRef} className="scroll-mt-28">
          {phase.kind !== 'idle' && (
            <div className="mx-auto mt-20 max-w-5xl">
              {sampleMode && <SampleBanner onGoLive={() => switchSampleMode(false)} />}
              {phase.kind === 'loading' && <LoadingTickets />}
              {phase.kind === 'error' && (
                <ErrorPanel
                  error={phase.error}
                  onRetry={() => lastRequest.current && run(lastRequest.current)}
                  onUseSample={() => switchSampleMode(true)}
                />
              )}
              {phase.kind === 'done' &&
                (phase.data.routes.length === 0 ? (
                  <NoRoutes />
                ) : (
                  <Results data={phase.data} onEnablePass={() => changePass(true)} />
                ))}
            </div>
          )}
        </div>

        <div className="animate-rise mt-20" style={{ animationDelay: '320ms' }}>
          <RouteShow origin={query.origin} destination={query.destination} passOn={query.annual_pass} />
        </div>

        <div className="mt-36 space-y-36">
          <Features />
          <Marquee />
        </div>
      </main>

      <Footer />
    </div>
  )
}
