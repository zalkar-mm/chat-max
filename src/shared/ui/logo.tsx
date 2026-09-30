import { cn } from '../lib/cn'

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  const rootCn = cn(
    'flex size-12 items-center justify-center rounded-logo bg-accent text-white',
    className,
  )

  return (
    <div className={rootCn} aria-hidden>
      <svg
        className="size-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        <path d="M9 12h.01M15 12h.01" strokeWidth="3" />
      </svg>
    </div>
  )
}
