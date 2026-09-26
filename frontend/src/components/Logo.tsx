export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0e7a4b" />
      <path d="M12.5 6h7L25 26H7z" fill="#0b1f15" opacity=".55" />
      <path
        d="M16 8v3.5M16 14.5v3.5M16 21v4"
        stroke="#f2b705"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
