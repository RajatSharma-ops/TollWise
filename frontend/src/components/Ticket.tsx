import { useState } from 'react'
import { ArrowUpRight, ChevronDown, Clock, Milestone, Ticket as TicketIcon } from 'lucide-react'
import type { PassStatus, Route, Toll } from '../lib/types'
import { distance, duration, inr } from '../lib/format'
import { useCountUp } from '../lib/hooks'

export interface Stamp {
  label: string
  tone: 'green' | 'amber'
}

interface Props {
  route: Route
  number: number
  origin: string
  destination: string
  passOn: boolean
  stamps: Stamp[]
  delay: number
}

const STATUS_TEXT: Record<PassStatus, { text: string; className: string }> = {
  COVERED: { text: 'Covered by Annual Pass', className: 'text-stamp-green' },
  NOT_COVERED: { text: 'Not covered · full fee', className: 'text-paper-dim' },
  UNKNOWN: { text: 'Unverified · charged in full', className: 'text-stamp-amber' },
}

function isFree(t: Toll, passOn: boolean) {
  return passOn && t.annual_pass_status === 'COVERED'
}

// Origin → plazas → destination drawn like a metro line.
function TollLine({ route, origin, destination, passOn }: Omit<Props, 'number' | 'stamps' | 'delay'>) {
  const dense = route.tolls.length > 6
  return (
    <div className="mt-7">
      <div className="relative flex items-start justify-between gap-1">
        <span className="absolute top-[7px] right-2 left-2 h-[2px] bg-[repeating-linear-gradient(90deg,var(--paper-ink)_0_8px,transparent_8px_12px)] opacity-25" />
        <Stop label={origin} />
        {route.tolls.map((t, i) => {
          const free = isFree(t, passOn)
          const tone =
            free ? 'bg-stamp-green border-stamp-green'
            : passOn && t.annual_pass_status === 'UNKNOWN' ? 'bg-paper border-stamp-amber'
            : 'bg-paper border-paper-ink'
          return (
            <div key={i} className="relative flex min-w-0 flex-col items-center" title={`${t.name}: ${inr(t.normal_fee)}`}>
              <span className={`size-4 rounded-full border-[3px] ${tone}`} />
              {!dense && (
                <span className="mt-2 font-mono text-[11px] leading-tight whitespace-nowrap tabular-nums">
                  {free ? (
                    <>
                      <span className="text-paper-dim line-through">{inr(t.normal_fee)}</span>
                      <span className="block text-center font-bold text-stamp-green">₹0</span>
                    </>
                  ) : (
                    <span className="font-semibold">{inr(t.payable_fee)}</span>
                  )}
                </span>
              )}
            </div>
          )
        })}
        <Stop label={destination} />
      </div>
    </div>
  )
}

function Stop({ label }: { label: string }) {
  return (
    <div className="relative flex max-w-24 min-w-0 flex-col items-center">
      <span className="grid size-4 place-items-center rounded-[5px] bg-paper-ink">
        <span className="size-1.5 rounded-full bg-paper" />
      </span>
      <span className="mt-2 max-w-full truncate font-mono text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </span>
    </div>
  )
}

// Deterministic bar widths so each route always gets the same barcode.
function barWidths(seed: string): number[] {
  let h = 7
  return Array.from({ length: 46 }, (_, i) => {
    h = (h * 31 + seed.charCodeAt(i % seed.length)) % 997
    return 1 + (h % 3)
  })
}

function Barcode({ seed }: { seed: string }) {
  const bars = barWidths(seed)
  return (
    <div className="flex h-10 items-stretch justify-center gap-[2px]" aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} className={i % 2 ? 'bg-transparent' : 'bg-paper-ink'} style={{ width: w }} />
      ))}
    </div>
  )
}

function Receipt({ route, origin, destination, passOn }: Omit<Props, 'number' | 'stamps' | 'delay'>) {
  const saved = route.normal_toll - route.payable_toll
  return (
    <div className="paper torn animate-rise mx-3 px-5 pt-6 pb-9 font-mono text-[12.5px] sm:mx-8 sm:px-8">
      <div className="text-center">
        <p className="font-bold tracking-[0.2em] uppercase">Itemised toll receipt</p>
        <p className="mt-1 text-paper-dim">
          {origin} → {destination} · Private car
        </p>
      </div>
      <div className="my-4 border-t border-dashed border-paper-line" />

      {route.tolls.length === 0 ? (
        <p className="py-2 text-center text-paper-dim">No toll plazas on this route.</p>
      ) : (
        <ol className="space-y-3">
          {route.tolls.map((t, i) => {
            const free = isFree(t, passOn)
            const status = STATUS_TEXT[passOn ? t.annual_pass_status : 'NOT_COVERED']
            return (
              <li key={i}>
                <div className="flex items-baseline gap-2">
                  <span className="text-paper-dim tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 font-semibold">{t.name}</span>
                  <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-paper-dim/50" />
                  <span className="shrink-0 text-right tabular-nums">
                    {free && <span className="mr-2 text-paper-dim line-through">{inr(t.normal_fee)}</span>}
                    <span className={`font-bold ${free ? 'text-stamp-green' : ''}`}>{inr(t.payable_fee)}</span>
                  </span>
                </div>
                {passOn && (
                  <p className={`mt-0.5 pl-7 text-[10.5px] tracking-wider uppercase ${status.className}`}>
                    {status.text}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <div className="my-4 border-t border-dashed border-paper-line" />
      <dl className="space-y-1.5 tabular-nums">
        <div className="flex justify-between">
          <dt className="text-paper-dim">Standard tolls</dt>
          <dd>{inr(route.normal_toll)}</dd>
        </div>
        {passOn && (
          <div className="flex justify-between text-stamp-green">
            <dt>Annual Pass</dt>
            <dd>−{inr(saved)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-paper-ink pt-2 text-base font-bold">
          <dt>Total payable</dt>
          <dd>{inr(route.payable_toll)}</dd>
        </div>
      </dl>
      <div className="mt-6">
        <Barcode seed={route.route_name + route.distance_km} />
        <p className="mt-2 text-center text-[10px] tracking-[0.25em] text-paper-dim uppercase">
          Drive safe · Check signage for current rates
        </p>
      </div>
    </div>
  )
}

export function Ticket({ route, number, origin, destination, passOn, stamps, delay }: Props) {
  const [open, setOpen] = useState(false)
  const price = useCountUp(route.payable_toll, 800)
  const count = route.tolls.length
  const saved = passOn && route.annual_pass_savings > 0

  return (
    <div className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <article className="group flex flex-col drop-shadow-[0_24px_36px_rgb(0_0_0/0.5)] transition-transform duration-300 hover:-translate-y-1 md:flex-row">
        <div className="paper notch-b md:notch-r relative flex-1 rounded-t-[22px] p-6 sm:p-7 md:rounded-l-[22px] md:rounded-tr-none">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.16em] text-paper-dim uppercase">
            <span className="font-bold text-paper-ink">Route {String(number).padStart(2, '0')}</span>
            <span>TollWise · NH</span>
          </div>

          {stamps.length > 0 && (
            <div className="mt-3 flex gap-2 sm:absolute sm:top-6 sm:right-7 sm:mt-0">
              {stamps.map((s, i) => (
                <span
                  key={s.label}
                  className={`stamp px-2 py-1 text-[10.5px] ${s.tone === 'green' ? 'text-stamp-green' : 'text-stamp-amber'}`}
                  style={{ transform: `rotate(${i % 2 ? 5 : -7}deg)` }}
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}

          <h3 className="mt-3 text-2xl sm:max-w-[68%] leading-tight font-semibold tracking-tight sm:text-[26px]">
            {route.route_name}
          </h3>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12.5px] text-paper-dim">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Distance</dt>
              <Milestone className="size-3.5" />
              <dd>{distance(route.distance_km)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Drive time</dt>
              <Clock className="size-3.5" />
              <dd>{duration(route.duration_minutes)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Toll plazas</dt>
              <TicketIcon className="size-3.5" />
              <dd>
                {count} {count === 1 ? 'plaza' : 'plazas'}
              </dd>
            </div>
          </dl>

          {count > 0 && <TollLine route={route} origin={origin} destination={destination} passOn={passOn} />}

          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-paper-line px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition hover:border-paper-ink"
          >
            {open ? 'Hide receipt' : 'Itemised receipt'}
            <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="paper notch-t md:notch-l flex flex-col justify-between gap-5 rounded-b-[22px] border-t-2 border-dashed border-paper-line p-6 sm:p-7 md:w-64 md:rounded-r-[22px] md:rounded-bl-none md:border-t-0 md:border-l-2">
          <div>
            <p className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-paper-dim uppercase">
              {passOn ? 'You pay' : 'Toll total'}
            </p>
            <p className="mt-1 font-mono text-[44px] leading-none font-bold tracking-tight tabular-nums">
              {inr(Math.round(price))}
            </p>
            {saved && (
              <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[12px]">
                <span className="text-paper-dim line-through">{inr(route.normal_toll)}</span>
                <span className="rounded bg-stamp-green px-1.5 py-0.5 font-bold text-paper">
                  SAVED {inr(route.annual_pass_savings)}
                </span>
              </p>
            )}
          </div>
          {route.google_maps_url && (
            <a
              href={route.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-ink px-4 py-3 text-sm font-semibold text-paper transition hover:gap-3 hover:bg-black"
            >
              Navigate
              <ArrowUpRight className="size-4" />
            </a>
          )}
        </div>
      </article>

      {open && <Receipt route={route} origin={origin} destination={destination} passOn={passOn} />}
    </div>
  )
}
