import type { ReactNode } from 'react'

import { AlertCircle, Info, type LucideIcon } from 'lucide-react'

import { cn } from '../lib/cn'

type InlineAlertTone = 'error' | 'info'

type InlineAlertProps = {
  tone: InlineAlertTone
  children: ReactNode
}

const TONE_CLASSES: Record<InlineAlertTone, string> = {
  error: 'border-l-[3px] border-alert-error bg-alert-error',
  info: 'bg-tertiary',
}

const ICON_CLASSES: Record<InlineAlertTone, string> = {
  error: 'text-negative',
  info: 'text-icon-secondary',
}

const TONE_ICON: Record<InlineAlertTone, LucideIcon> = {
  error: AlertCircle,
  info: Info,
}

const TONE_ROLE: Record<InlineAlertTone, 'alert' | 'status'> = {
  error: 'alert',
  info: 'status',
}

export function InlineAlert({ tone, children }: InlineAlertProps) {
  const Icon = TONE_ICON[tone]
  const rootCn = cn('flex items-start gap-3 rounded-m px-4 py-3', TONE_CLASSES[tone])
  const iconCn = cn('size-5 shrink-0', ICON_CLASSES[tone])

  return (
    <div role={TONE_ROLE[tone]} className={rootCn}>
      <Icon className={iconCn} aria-hidden />
      <div className="min-w-0 typo-detail leading-5 text-primary">{children}</div>
    </div>
  )
}
