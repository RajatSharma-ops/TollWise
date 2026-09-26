import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Flag } from 'lucide-react'
import { useCountUp, usePrefersReducedMotion } from '../lib/hooks'
import { inr } from '../lib/format'

// An illustrative trip: a car drives the road and each plaza it passes either
// drops to ₹0 (covered by the Annual Pass) or charges the full fee.
const BOOTHS = [
  { at: 0.22, fee: 220, covered: true, label: 'NH plaza' },
  { at: 0.52, fee: 125, covered: true, label: 'NH plaza' },
  { at: 0.8, fee: 90, covered: false, label: 'State toll' },
]
const TRAVEL_MS = 6500
const HOLD_MS = 1800

const WIDE = { w: 1000, h: 380, d: 'M 70 290 C 250 290, 300 120, 480 140 S 720 280, 930 100' }
const TALL = { w: 600, h: 720, d: 'M 90 110 C 560 110, 560 370, 300 370 S 40 620, 510 620' }

const CONTOURS = [
  [180, 90, 5],
  [820, 330, 4],
  [560, 40, 3],
]

interface Point {
  x: number
  y: number
}

function useCompact() {
  const query = '(max-width: 639px)'
  const [compact, setCompact] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setCompact(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return compact
}

function clip(text: string, fallback: string) {
  const t = text.trim() || fallback
  return t.length > 16 ? `${t.slice(0, 15)}…` : t
}

interface Props {
  origin: string
  destination: string
  passOn: boolean
}

export function RouteShow({ origin, destination, passOn }: Props) {
  const compact = useCompact()
  const geo = compact ? TALL : WIDE
  const reduced = usePrefersReducedMotion()

  const frameRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const carRef = useRef<SVGGElement>(null)
  const trailRef = useRef<SVGGElement>(null)

  const [layout, setLayout] = useState<{ len: number; booths: Point[]; start: Point; end: Point } | null>(null)
  const [animPassed, setPassed] = useState(0)
  const [visible, setVisible] = useState(true)

  useLayoutEffect(() => {
    const p = pathRef.current
    if (!p) return
    const len = p.getTotalLength()
    const pt = (l: number) => {
      const { x, y } = p.getPointAtLength(l)
      return { x, y }
    }
    setLayout({ len, booths: BOOTHS.map((b) => pt(b.at * len)), start: pt(0), end: pt(len) })
  }, [geo.d])

  // Only animate while the scene is on screen.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!layout) return
    const p = pathRef.current!
    const car = carRef.current!
    const trail = trailRef.current!

    const place = (t: number) => {
      const l = t * layout.len
      const a = p.getPointAtLength(Math.max(0, l - 1))
      const b = p.getPointAtLength(Math.min(layout.len, l + 1))
      const pt = p.getPointAtLength(l)
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
      car.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${angle})`)
      trail.style.strokeDashoffset = String(layout.len - l)
    }

    if (reduced) {
      place(1)
      return
    }
    if (!visible) return

    let frame = 0
    let last = -1
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, ((now - start) % (TRAVEL_MS + HOLD_MS)) / TRAVEL_MS)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      place(eased)
      const count = BOOTHS.filter((b) => b.at <= eased).length
      if (count !== last) {
        last = count
        setPassed(count)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [layout, passOn, reduced, visible])

  const passed = reduced ? BOOTHS.length : animPassed
  const done = BOOTHS.slice(0, passed)
  const paid = done.reduce((s, b) => s + (passOn && b.covered ? 0 : b.fee), 0)
  const saved = done.reduce((s, b) => s + (passOn && b.covered ? b.fee : 0), 0)
  const couldSave = BOOTHS.filter((b) => b.covered).reduce((s, b) => s + b.fee, 0)
  const paidShown = useCountUp(paid, 450)
  const savedShown = useCountUp(saved, 450)

  const pos = (p: Point) => ({ left: `${(p.x / geo.w) * 100}%`, top: `${(p.y / geo.h) * 100}%` })

  return (
    <div className="relative mx-auto max-w-5xl" ref={frameRef}>
      <div className="absolute inset-x-10 -bottom-6 top-16 rounded-full bg-glow/15 blur-3xl" aria-hidden="true" />
      <figure className="glass relative rounded-[30px] p-2">
        <div className="overflow-hidden rounded-[24px] border border-edge bg-raise/90">
          <div className="flex items-center justify-between border-b border-edge px-4 py-3 font-mono text-[11px] text-dim">
            <div className="flex items-center gap-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-white/10" />
                <span className="size-2.5 rounded-full bg-white/10" />
                <span className="size-2.5 rounded-full bg-white/10" />
              </span>
              <span>trip preview</span>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 tracking-wider uppercase transition-colors ${
                passOn ? 'border-glow/40 text-glow' : 'border-edge text-dim'
              }`}
            >
              Annual Pass · {passOn ? 'On' : 'Off'}
            </span>
          </div>

          <div className="relative" aria-hidden="true">
            <svg viewBox={`0 0 ${geo.w} ${geo.h}`} className="block h-auto w-full">
              <defs>
                <linearGradient id="trail" x1="0" x2="1">
                  <stop offset="0" stopColor="#3ddc84" />
                  <stop offset="1" stopColor="#ffc53d" />
                </linearGradient>
                <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="14" y1="0" x2="80" y2="0">
                  <stop offset="0" stopColor="#fff6d6" stopOpacity=".55" />
                  <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
                </linearGradient>
                <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              {CONTOURS.map(([cx, cy, rings]) =>
                Array.from({ length: rings }, (_, i) => (
                  <ellipse
                    key={`${cx}-${i}`}
                    cx={cx}
                    cy={cy}
                    rx={40 + i * 42}
                    ry={26 + i * 28}
                    fill="none"
                    stroke="rgb(255 255 255 / 0.045)"
                    strokeDasharray={i % 2 ? '2 6' : undefined}
                  />
                )),
              )}

              <path d={geo.d} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="48" strokeLinecap="round" />
              <path ref={pathRef} d={geo.d} fill="none" stroke="#0c1c14" strokeWidth="44" strokeLinecap="round" />
              <path d={geo.d} fill="none" stroke="#ffc53d" strokeOpacity=".3" strokeWidth="2" strokeDasharray="10 14" />
              {layout && (
                <>
                  <g ref={trailRef} strokeDasharray={layout.len} strokeDashoffset={layout.len}>
                    <path
                      d={geo.d}
                      fill="none"
                      stroke="url(#trail)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      filter="url(#soft)"
                      opacity=".6"
                    />
                    <path d={geo.d} fill="none" stroke="url(#trail)" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                </>
              )}

              <g ref={carRef}>
                <path d="M 14 -8 L 80 -30 L 80 30 L 14 8 Z" fill="url(#beam)" />
                <rect x="-17" y="-10" width="34" height="20" rx="7" fill="#ecf3ee" />
                <rect x="3" y="-7.5" width="8" height="15" rx="2.5" fill="#0b1812" opacity=".85" />
                <rect x="-13" y="-7.5" width="5" height="15" rx="2" fill="#0b1812" opacity=".5" />
                <rect x="-18" y="-8" width="2.5" height="4" rx="1" fill="#ff5f56" />
                <rect x="-18" y="4" width="2.5" height="4" rx="1" fill="#ff5f56" />
              </g>
            </svg>

            {layout && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(layout.start)}>
                  <span className="absolute inset-0 animate-ping rounded-full bg-glow/40" />
                  <span className="relative block size-3.5 rounded-full border-[3px] border-bg bg-glow" />
                  <span className="absolute top-full left-1/2 mt-3 -translate-x-1/2 rounded-md border border-edge bg-bg/80 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-fg">
                    {clip(origin, 'Delhi')}
                  </span>
                </div>

                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(layout.end)}>
                  <span className="grid size-8 place-items-center rounded-full border border-amber/50 bg-bg text-amber">
                    <Flag className="size-4" />
                  </span>
                  <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border border-edge bg-bg/80 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-fg">
                    {clip(destination, 'Jaipur')}
                  </span>
                </div>

                {BOOTHS.map((b, i) => {
                  const isPassed = i < passed
                  const free = isPassed && passOn && b.covered
                  return (
                    <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(layout.booths[i])}>
                      {free && (
                        <span
                          key={`ring-${passOn}`}
                          className="pulse-ring absolute inset-0 rounded-xl border-2 border-glow"
                          style={{ animationIterationCount: 1 }}
                        />
                      )}
                      <span
                        className={`relative grid size-9 place-items-center rounded-xl border bg-bg font-mono text-sm font-bold transition-colors duration-300 ${
                          free
                            ? 'border-glow text-glow shadow-[0_0_24px_-2px_var(--glow)]'
                            : isPassed
                              ? 'border-amber text-amber'
                              : 'border-edge text-dim'
                        }`}
                      >
                        ₹
                      </span>
                      <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap">
                        {!isPassed && (
                          <span className="block rounded-full border border-edge bg-bg/80 px-2.5 py-1 font-mono text-[11px] text-fg">
                            {inr(b.fee)}
                          </span>
                        )}
                        {free && (
                          <span key="free" className="animate-pop block rounded-full bg-glow px-2.5 py-1 font-mono text-[11px] font-bold text-bg">
                            ₹0 · covered
                          </span>
                        )}
                        {isPassed && !free && (
                          <span key="paid" className="animate-pop block rounded-full bg-amber px-2.5 py-1 font-mono text-[11px] font-bold text-bg">
                            −{inr(b.fee)}
                          </span>
                        )}
                      </span>
                      {!compact && (
                        <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 font-mono text-[10px] tracking-wider whitespace-nowrap text-dim uppercase">
                          {b.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <figcaption className="grid grid-cols-2 border-t border-edge font-mono sm:grid-cols-[1fr_1fr_1.4fr]">
            <div className="border-r border-edge px-4 py-3">
              <p className="text-[10px] tracking-[0.16em] text-dim uppercase">Paid at booths</p>
              <p className="mt-0.5 text-xl font-bold text-fg tabular-nums">{inr(Math.round(paidShown))}</p>
            </div>
            <div className="px-4 py-3 sm:border-r sm:border-edge">
              <p className="text-[10px] tracking-[0.16em] text-dim uppercase">
                {passOn ? 'Saved by pass' : 'Pass would save'}
              </p>
              <p className={`mt-0.5 text-xl font-bold tabular-nums ${passOn ? 'text-glow' : 'text-dim'}`}>
                {inr(Math.round(passOn ? savedShown : couldSave))}
              </p>
            </div>
            <p className="col-span-2 border-t border-edge px-4 py-3 text-[11px] leading-relaxed text-dim sm:col-span-1 sm:border-t-0">
              Illustration. Plazas on the NHAI Annual Pass list drop to ₹0. Everything else is
              charged in full.
            </p>
          </figcaption>
        </div>
      </figure>
    </div>
  )
}
