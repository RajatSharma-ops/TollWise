import type { DatasetStatus } from '../lib/types'
import { Logo } from './Logo'

interface Props {
  // undefined = still checking, null = API unreachable
  dataset: DatasetStatus | null | undefined
  sampleMode: boolean
}

function StatusPill({ dataset, sampleMode }: Props) {
  let dot = 'bg-dim'
  let label = 'Connecting…'
  if (sampleMode) {
    dot = 'bg-amber'
    label = 'Sample mode'
  } else if (dataset === null) {
    label = 'Server offline'
  } else if (dataset) {
    dot = dataset.dataset_loaded ? 'bg-glow' : 'bg-amber'
    label = dataset.dataset_loaded ? 'Pass list live' : 'Pass list missing'
  }
  const live = !sampleMode && dataset?.dataset_loaded
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-dim">
      <span className="relative flex size-1.5">
        {live && <span className={`absolute inset-0 animate-ping rounded-full ${dot} opacity-70`} />}
        <span className={`relative size-1.5 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  )
}

const LINKS = [
  ['Compare', '#top'],
  ['How it works', '#how'],
  ['Plazas', '#plazas'],
]

export function Nav(props: Props) {
  return (
    <div className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4">
      <nav className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full py-2 pr-2 pl-3 shadow-[0_10px_40px_-10px_rgb(0_0_0/0.6)]">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo className="size-7" />
          <span className="text-[15px] font-semibold tracking-tight">TollWise</span>
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3.5 py-1.5 text-sm text-dim transition hover:bg-white/5 hover:text-fg"
            >
              {label}
            </a>
          ))}
        </div>
        <StatusPill {...props} />
      </nav>
    </div>
  )
}
