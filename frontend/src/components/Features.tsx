import type { ReactNode } from 'react'
import { ArrowUpRight, Check, HelpCircle, Minus } from 'lucide-react'
import { spotlight, useReveal } from '../lib/hooks'

function Tile({ className = '', eyebrow, title, body, children }: {
  className?: string
  eyebrow: string
  title: ReactNode
  body: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      onMouseMove={spotlight}
      className={`reveal glass spotlight flex flex-col overflow-hidden rounded-[28px] p-7 ${className}`}
    >
      <p className="font-mono text-[10.5px] tracking-[0.2em] text-glow uppercase">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-dim">{body}</p>
      <div className="mt-8 flex flex-1 items-end">{children}</div>
    </div>
  )
}

function MiniTickets() {
  const tickets = [
    { name: 'via Expressway', price: '₹0', rot: -7, x: -8 },
    { name: 'via NH 48', price: '₹90', rot: 2, x: 0 },
    { name: 'via SH 14', price: '₹165', rot: 9, x: 8 },
  ]
  return (
    <div className="relative mx-auto flex h-40 w-full max-w-lg origin-bottom scale-[0.62] items-end justify-center sm:scale-100">
      {tickets.map((t, i) => (
        <div
          key={t.name}
          className="paper absolute bottom-0 flex w-56 items-center justify-between rounded-2xl px-4 py-5 shadow-2xl"
          style={{ transform: `translateX(${(i - 1) * 110 + t.x}px) rotate(${t.rot}deg)`, zIndex: i === 0 ? 3 : 3 - i }}
        >
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] text-paper-dim uppercase">Route 0{i + 1}</p>
            <p className="mt-1 text-sm font-semibold">{t.name}</p>
          </div>
          <p className="font-mono text-xl font-bold">{t.price}</p>
        </div>
      ))}
    </div>
  )
}

function PlazaChecks() {
  const rows = [
    { name: 'Hilalpur', Icon: Check, tone: 'text-glow border-glow/30 bg-glow/10', fee: '₹0' },
    { name: 'Manoharpur', Icon: Check, tone: 'text-glow border-glow/30 bg-glow/10', fee: '₹0' },
    { name: 'City bypass', Icon: HelpCircle, tone: 'text-amber border-amber/30 bg-amber/10', fee: '₹65' },
    { name: 'State toll', Icon: Minus, tone: 'text-dim border-edge bg-white/5', fee: '₹90' },
  ]
  return (
    <ul className="w-full divide-y divide-edge rounded-2xl border border-edge bg-bg/40 font-mono text-sm">
      {rows.map(({ name, Icon, tone, fee }) => (
        <li key={name} className="flex items-center justify-between px-4 py-2.5">
          <span className="flex items-center gap-2.5">
            <span className={`grid size-5 place-items-center rounded-md border ${tone}`}>
              <Icon className="size-3" strokeWidth={3} />
            </span>
            {name}
          </span>
          <span className="tabular-nums text-dim">{fee}</span>
        </li>
      ))}
    </ul>
  )
}

function MiniMap() {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-edge bg-bg/50">
      <svg viewBox="0 0 600 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={i * 55} y1="0" x2={i * 55 - 60} y2="160" stroke="rgb(255 255 255 / 0.04)" />
        ))}
        <path d="M 40 130 C 160 130, 200 40, 320 60 S 480 120, 560 30" fill="none" stroke="#0c1c14" strokeWidth="18" strokeLinecap="round" />
        <path d="M 40 130 C 160 130, 200 40, 320 60 S 480 120, 560 30" fill="none" stroke="#3ddc84" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" />
        <circle cx="40" cy="130" r="7" fill="#3ddc84" />
        <circle cx="560" cy="30" r="7" fill="#ffc53d" />
      </svg>
      <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg">
        Navigate <ArrowUpRight className="size-4" />
      </span>
    </div>
  )
}

export function Features() {
  const heading = useReveal<HTMLDivElement>()
  return (
    <section id="how" className="scroll-mt-28">
      <div ref={heading} className="reveal max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.2em] text-dim uppercase">How it works</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
          Built for the <span className="accent-word">road ahead</span>
        </h2>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <Tile
          className="md:col-span-2"
          eyebrow="01 · Compare"
          title="Every route, side by side"
          body="TollWise pulls every alternative for your trip and prints each one as a ticket: distance, drive time and exactly what the tolls cost."
        >
          <MiniTickets />
        </Tile>
        <Tile
          eyebrow="02 · Check"
          title="Plaza by plaza"
          body="Each toll plaza is matched against the NHAI Annual Pass list."
        >
          <PlazaChecks />
        </Tile>
        <Tile
          eyebrow="03 · Trust"
          title="Honest when unsure"
          body="If a plaza can’t be confirmed, we charge it in full. We never guess that a toll is free."
        >
          <div className="flex items-center gap-3 rounded-2xl border border-amber/25 bg-amber/[0.06] px-4 py-3">
            <HelpCircle className="size-5 text-amber" />
            <span className="font-mono text-sm">
              <span className="text-amber">Unverified</span> <span className="text-dim">→ full fee</span>
            </span>
          </div>
        </Tile>
        <Tile
          className="md:col-span-2"
          eyebrow="04 · Go"
          title="One tap to the road"
          body="Picked your route? Open it straight in Google Maps and drive."
        >
          <MiniMap />
        </Tile>
      </div>
    </section>
  )
}
