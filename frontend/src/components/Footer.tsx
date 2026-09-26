import { ArrowUp } from 'lucide-react'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-edge">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="size-7" />
          <span className="font-semibold tracking-tight">TollWise</span>
        </div>
        <p className="max-w-md text-sm text-dim">
          Toll prices from TollGuru. Pass coverage from the NHAI plaza list. Estimates are for
          private cars. Always check signage on the road.
        </p>
        <a
          href="#top"
          className="inline-flex items-center gap-2 self-start rounded-full border border-edge px-4 py-2 text-sm text-dim transition hover:border-glow/40 hover:text-fg"
        >
          Back to top <ArrowUp className="size-4" />
        </a>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none mt-6 bg-gradient-to-b from-white/[0.14] to-transparent bg-clip-text text-center text-[clamp(5rem,22vw,20rem)] leading-[0.8] font-semibold tracking-[-0.07em] text-transparent select-none"
      >
        TollWise
      </p>
    </footer>
  )
}
