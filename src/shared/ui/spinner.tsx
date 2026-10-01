import { cn } from '../lib/cn'

type SpinnerSize = 20 | 24 | 32

type SpinnerProps = {
  size?: SpinnerSize
  className?: string
  /** Показ с задержкой 300 мс: быстрые действия не мигают индикатором. */
  isDelayed?: boolean
}

const STROKE_WIDTH = 2.5
const SEGMENT_SHARE = 0.25

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  20: 'size-5',
  24: 'size-6',
  32: 'size-8',
}

export function Spinner({ size = 20, className, isDelayed = true }: SpinnerProps) {
  const center = size / 2
  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const segment = circumference * SEGMENT_SHARE
  const dashArray = `${segment} ${circumference - segment}`
  const viewBox = `0 0 ${size} ${size}`
  const rootCn = cn(
    'shrink-0',
    isDelayed ? 'animate-spinner-delayed' : 'animate-spinner',
    SIZE_CLASSES[size],
    className,
  )

  return (
    <svg className={rootCn} viewBox={viewBox} fill="none" aria-hidden data-testid="spinner">
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        opacity={0.25}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={dashArray}
        strokeLinecap="round"
      />
    </svg>
  )
}
