import { Check } from 'lucide-react'
import { useReveal } from '../lib/hooks'

// Real plaza names taken from data/NH-Plazas.pdf.
const PLAZAS = [
  'Hilalpur', 'Manoharpur', 'Shahjahanpur', 'Sohna', 'Bharthana', 'Boriach', 'Charoti',
  'Choryasi', 'Nadiad', 'Hoskote', 'Samayapuram', 'Nellore', 'Sambhu', 'Nayagaon',
  'Khudiyala', 'Keesara', 'Sullurpet', 'Lohari', 'Badi Ghati', 'Dungarpur',
  'Padmanavapur', 'Rasampalayam', 'Daulatpura', 'Itaunja', 'Mahuvan',
]

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div
        className="animate-marquee flex shrink-0 gap-3 pr-3"
        style={{ animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {[...items, ...items].map((name, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 rounded-full border border-edge bg-white/[0.03] px-4 py-2 text-sm whitespace-nowrap text-dim"
          >
            <Check className="size-3.5 text-glow" strokeWidth={3} />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Marquee() {
  const ref = useReveal<HTMLDivElement>()
  const half = Math.ceil(PLAZAS.length / 2)
  return (
    <section id="plazas" className="scroll-mt-28">
      <div ref={ref} className="reveal text-center">
        <p className="font-mono text-[11px] tracking-[0.2em] text-dim uppercase">On the NHAI Annual Pass list</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Over a thousand plazas, <span className="accent-word">checked for you</span>
        </h2>
      </div>
      <div className="mt-10 space-y-3">
        <Row items={PLAZAS.slice(0, half)} />
        <Row items={PLAZAS.slice(half)} reverse />
      </div>
    </section>
  )
}
