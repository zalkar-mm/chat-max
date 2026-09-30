import type { ReactNode } from 'react'

type GateProps = {
  when: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function Gate({ when, children, fallback = null }: GateProps) {
  if (!when) return fallback
  return children
}
