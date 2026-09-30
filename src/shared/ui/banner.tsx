import type { ReactNode } from 'react'

import { X } from 'lucide-react'

import { cn } from '../lib/cn'

import { IconButton } from './icon-button'

type BannerTone = 'error' | 'warn' | 'ok'

type BannerProps = {
  tone: BannerTone
  icon: ReactNode
  children: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
}

type BannerDismissProps = {
  onDismiss?: () => void
  label: string
}

const TONE_CLASSES: Record<BannerTone, string> = {
  error: 'bg-banner-error text-banner-error',
  warn: 'bg-banner-warn text-banner-warn',
  ok: 'bg-banner-ok text-banner-ok',
}

const ICON_CLASSES: Record<BannerTone, string> = {
  error: 'text-banner-error-icon',
  warn: 'text-banner-warn-icon',
  ok: 'text-banner-ok-icon',
}

const TONE_ROLE: Record<BannerTone, 'alert' | 'status'> = {
  error: 'alert',
  warn: 'status',
  ok: 'status',
}

function BannerDismiss({ onDismiss, label }: BannerDismissProps) {
  if (!onDismiss) return null

  return (
    <IconButton size="sm" label={label} onClick={onDismiss} className="ml-auto">
      <X aria-hidden />
    </IconButton>
  )
}

export function Banner({ tone, icon, children, onDismiss, dismissLabel = 'Скрыть' }: BannerProps) {
  const rootCn = cn(
    'flex min-h-10 w-full items-center gap-3 border-b border-divider-soft px-4 py-2 typo-detail',
    TONE_CLASSES[tone],
  )
  const iconCn = cn('flex shrink-0', ICON_CLASSES[tone])

  return (
    <div role={TONE_ROLE[tone]} className={rootCn}>
      <span className={iconCn}>{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
      <BannerDismiss onDismiss={onDismiss} label={dismissLabel} />
    </div>
  )
}
