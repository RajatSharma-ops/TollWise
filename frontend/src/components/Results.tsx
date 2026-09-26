import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import type { RouteSearchResponse } from '../lib/types'
import { duration, inr } from '../lib/format'
import { spotlight, useCountUp } from '../lib/hooks'
import { Ticket, type Stamp } from './Ticket'

type SortKey = 'price' | 'time' | 'distance'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Cheapest' },
  { key: 'time', label: 'Fastest' },
  { key: 'distance', label: 'Shortest' },
]

function indexOfMin(values: number[]): number {
  return values.reduce((best, v, i) => (v < values[best] ? i : best), 0)
}

function Tile({ label, children, sub, glow }: { label: string; children: ReactNode; sub: string; glow?: boolean }) {
  return (
    <div
      onMouseMove={spotlight}
      className={`glass spotlight rounded-3xl p-5 ${glow ? 'ring-1 ring-glow/30' : ''}`}
    >
      <p className="font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">{label}</p>
      <div className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${glow ? 'text-glow' : 'text-fg'}`}>
        {children}
      </div>
      <p className="mt-1 truncate text-sm text-dim">{sub}</p>
    </div>
  )
}

function Money({ value }: { value: number }) {
  return <>{inr(Math.round(useCountUp(value)))}</>
}

interface Props {
  data: RouteSearchResponse
  onEnablePass: () => void
}

export function Results({ data, onEnablePass }: Props) {
  const [sort, setSort] = useState<SortKey>('price')
  const passOn = data.annual_pass_applied
  const { routes } = data

  const cheapest = indexOfMin(routes.map((r) => r.payable_toll))
  const fastest = indexOfMin(routes.map((r) => r.duration_minutes))
  const bestSaving = indexOfMin(routes.map((r) => -r.annual_pass_savings))
  const maxSaving = routes[bestSaving]?.annual_pass_savings ?? 0

  const ordered = useMemo(() => {
    const pick = {
      price: (i: number) => routes[i].payable_toll,
      time: (i: number) => routes[i].duration_minutes,
      distance: (i: number) => routes[i].distance_km,
    }[sort]
    return routes.map((_, i) => i).sort((a, b) => pick(a) - pick(b))
  }, [routes, sort])

  function stampsFor(i: number): Stamp[] {
    if (routes.length < 2) return []
    const stamps: Stamp[] = []
    if (i === cheapest) stamps.push({ label: 'Best price', tone: 'green' })
    if (i === fastest) stamps.push({ label: 'Fastest', tone: 'amber' })
    return stamps
  }

  const sortIndex = SORTS.findIndex((s) => s.key === sort)

  return (
    <section aria-labelledby="results-title">
      <p className="font-mono text-[11px] tracking-[0.2em] text-glow uppercase">
        {routes.length} {routes.length === 1 ? 'route' : 'routes'} found ·{' '}
        {passOn ? 'Annual Pass applied' : 'Standard fares'}
      </p>
      <h2 id="results-title" className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
        {data.origin} to <span className="accent-word">{data.destination}</span>
      </h2>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Tile label="Lowest toll" sub={routes[cheapest].route_name}>
          <Money value={routes[cheapest].payable_toll} />
        </Tile>
        <Tile label="Fastest drive" sub={routes[fastest].route_name}>
          {duration(routes[fastest].duration_minutes)}
        </Tile>
        {passOn ? (
          <Tile
            label="Pass saves up to"
            sub={maxSaving > 0 ? routes[bestSaving].route_name : 'No covered plazas on these routes'}
            glow
          >
            <Money value={maxSaving} />
          </Tile>
        ) : (
          <button
            type="button"
            onClick={onEnablePass}
            onMouseMove={spotlight}
            className="glass spotlight group rounded-3xl p-5 text-left ring-1 ring-amber/25 transition hover:ring-amber/50"
          >
            <p className="font-mono text-[10.5px] tracking-[0.18em] text-amber uppercase">Have an Annual Pass?</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">See what you’d save</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-dim group-hover:text-fg">
              Re-price these routes <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
            </p>
          </button>
        )}
      </div>

      {routes.length > 1 && (
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="hidden font-mono text-[11px] tracking-[0.18em] text-dim uppercase sm:block">Sort tickets by</p>
          <div role="radiogroup" aria-label="Sort routes" className="glass relative grid grid-cols-3 rounded-full p-1">
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-fg transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${sortIndex * 100}%)` }}
            />
            {SORTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={sort === key}
                onClick={() => setSort(key)}
                className={`relative z-10 w-24 rounded-full py-2 text-sm font-medium transition-colors sm:w-28 ${
                  sort === key ? 'text-bg' : 'text-dim hover:text-fg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-7">
        {ordered.map((i, position) => (
          <Ticket
            key={`${data.origin}-${data.destination}-${passOn}-${i}`}
            route={routes[i]}
            number={i + 1}
            origin={data.origin}
            destination={data.destination}
            passOn={passOn}
            stamps={stampsFor(i)}
            delay={position * 90}
          />
        ))}
      </div>
    </section>
  )
}
