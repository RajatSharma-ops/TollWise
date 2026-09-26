import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeftRight, ArrowRight, LoaderCircle } from 'lucide-react'
import type { RouteSearchRequest } from '../lib/types'

const CITIES = [
  'Delhi', 'Jaipur', 'Mumbai', 'Pune', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata',
  'Ahmedabad', 'Vadodara', 'Surat', 'Lucknow', 'Agra', 'Kanpur', 'Chandigarh', 'Amritsar',
  'Dehradun', 'Gurugram', 'Noida', 'Indore', 'Bhopal', 'Nagpur', 'Nashik', 'Goa',
  'Mysuru', 'Coimbatore', 'Madurai', 'Kochi', 'Visakhapatnam', 'Vijayawada', 'Udaipur',
  'Jodhpur', 'Ajmer', 'Varanasi', 'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati',
]

const POPULAR: [string, string][] = [
  ['Delhi', 'Jaipur'],
  ['Mumbai', 'Pune'],
  ['Bengaluru', 'Chennai'],
  ['Ahmedabad', 'Vadodara'],
]

interface Props {
  value: RouteSearchRequest
  loading: boolean
  onChange: (next: RouteSearchRequest) => void
  onPassChange: (value: boolean) => void
  onSearch: (req: RouteSearchRequest) => void
}

function Field({
  id,
  label,
  value,
  placeholder,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  children?: ReactNode
}) {
  return (
    <label
      htmlFor={id}
      className="group relative block cursor-text rounded-[18px] px-5 py-3 text-left transition hover:bg-white/[0.04] focus-within:bg-white/[0.06]"
    >
      <span className="block font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
        {label}
      </span>
      <input
        id={id}
        list="tollwise-cities"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent text-lg font-medium text-fg outline-none placeholder:text-dim/60"
      />
      {children}
    </label>
  )
}

export function SearchBar({ value, loading, onChange, onPassChange, onSearch }: Props) {
  const { origin, destination, annual_pass: pass } = value
  const [error, setError] = useState<string | null>(null)

  function submit(o = origin, d = destination) {
    const from = o.trim()
    const to = d.trim()
    if (!from || !to) {
      setError('Tell us where you’re starting and where you’re headed.')
      return
    }
    if (from.toLowerCase() === to.toLowerCase()) {
      setError('Start and destination are the same place.')
      return
    }
    setError(null)
    onSearch({ origin: from, destination: to, annual_pass: pass })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="glass rounded-[26px] p-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7),0_0_0_1px_rgb(61_220_132/0.05)]"
      >
        <div className="grid items-stretch gap-1 lg:grid-cols-[1fr_auto_1fr_auto_auto]">
          <Field
            id="origin"
            label="From"
            value={origin}
            placeholder="Delhi"
            onChange={(v) => onChange({ ...value, origin: v })}
          />

          <div className="relative flex items-center justify-center lg:px-1">
            <span className="absolute inset-x-5 top-1/2 h-px bg-edge lg:hidden" />
            <button
              type="button"
              onClick={() => onChange({ ...value, origin: destination, destination: origin })}
              aria-label="Swap start and destination"
              className="relative z-10 grid size-9 place-items-center rounded-full border border-edge bg-raise text-dim transition hover:rotate-180 hover:border-glow/50 hover:text-glow"
            >
              <ArrowLeftRight className="size-4" />
            </button>
          </div>

          <Field
            id="destination"
            label="To"
            value={destination}
            placeholder="Jaipur"
            onChange={(v) => onChange({ ...value, destination: v })}
          />

          <button
            type="button"
            role="switch"
            aria-checked={pass}
            onClick={() => onPassChange(!pass)}
            className="flex items-center justify-between gap-4 rounded-[18px] px-5 py-3 text-left transition hover:bg-white/[0.04] lg:border-l lg:border-edge lg:rounded-l-none"
          >
            <span>
              <span className="block font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
                Annual Pass
              </span>
              <span className={`mt-0.5 block text-lg font-medium ${pass ? 'text-glow' : 'text-fg'}`}>
                {pass ? 'I have one' : 'Not using'}
              </span>
            </span>
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                pass ? 'border-glow/60 bg-glow/25' : 'border-edge bg-white/5'
              }`}
            >
              <span
                className={`size-4.5 rounded-full transition-all duration-300 ${
                  pass ? 'translate-x-[22px] bg-glow shadow-[0_0_12px_var(--glow)]' : 'translate-x-[3px] bg-dim'
                }`}
              />
            </span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-1 inline-flex items-center justify-center gap-2 overflow-hidden rounded-[18px] bg-glow px-7 py-4 text-base font-semibold text-bg transition hover:shadow-[0_0_40px_-4px_var(--glow)] disabled:cursor-wait lg:mt-0"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {loading ? <LoaderCircle className="size-5 animate-spin" /> : null}
            <span className="relative">{loading ? 'Checking' : 'Compare'}</span>
            {!loading && <ArrowRight className="relative size-5 transition group-hover:translate-x-0.5" />}
          </button>
        </div>
      </form>

      <datalist id="tollwise-cities">
        {CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-coral">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 font-mono text-[11px] tracking-wider text-dim uppercase">Try</span>
        {POPULAR.map(([from, to]) => (
          <button
            key={from + to}
            type="button"
            disabled={loading}
            onClick={() => {
              onChange({ ...value, origin: from, destination: to })
              submit(from, to)
            }}
            className="rounded-full border border-edge bg-white/[0.03] px-3.5 py-1.5 text-sm text-dim transition hover:border-glow/40 hover:text-fg disabled:opacity-50"
          >
            {from} <span className="text-glow/70">→</span> {to}
          </button>
        ))}
      </div>
    </div>
  )
}
