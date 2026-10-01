import type { ComponentProps, ReactNode } from 'react'

import { ExternalLink, X } from 'lucide-react'

import { cn } from '../lib/cn'

import { Gate } from './gate'
import { IconButton } from './icon-button'
import { Spinner } from './spinner'

type BannerTone = 'error' | 'warn' | 'ok'

/** Сам баннер не live-регион: регион должен существовать до появления текста (см. StatusBanners). */
type BannerProps = {
  tone: BannerTone
  icon: ReactNode
  children: ReactNode
  /** Кнопки баннера (`BannerAction`, `BannerLink`): между текстом и «×», на mobile — второй строкой. */
  actions?: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
}

type BannerActionsProps = {
  children: ReactNode
}

export type BannerActionProps = ComponentProps<'button'> & {
  loading?: boolean
}

export type BannerLinkProps = ComponentProps<'a'> & {
  disabled?: boolean
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

const ACTION_BASE =
  'inline-flex h-(--touch-min) shrink-0 items-center gap-1.5 rounded-s px-2.5 typo-action-small text-link transition-colors md:h-8'

function BannerActions({ children }: BannerActionsProps) {
  if (!children) return null

  // Отступ слева = иконка 20 + gap 12: на mobile кнопки выровнены по тексту (DS-3 §6).
  return (
    <div className="order-last -my-1.5 flex basis-full flex-wrap items-center gap-x-2 pl-6 md:order-none md:my-0 md:basis-auto md:pl-0">
      {children}
    </div>
  )
}

/** Ghost-текстовая кнопка внутри баннера. */
export function BannerAction({
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: BannerActionProps) {
  const isInactive = disabled && !loading
  const rootCn = cn(
    ACTION_BASE,
    'cursor-pointer enabled:hover:bg-ghost-hover enabled:active:bg-ghost-pressed',
    isInactive && 'cursor-default opacity-60',
    className,
  )

  // Во время загрузки кнопка остаётся в фокусе (aria-disabled вместо disabled), клик игнорируется.
  const handleClick: BannerActionProps['onClick'] = (event) => {
    if (loading) return
    onClick?.(event)
  }

  return (
    <button
      type={type}
      className={rootCn}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading}
      {...props}
      onClick={handleClick}
    >
      <Gate when={loading}>
        <Spinner size={20} className="size-4" />
      </Gate>
      {children}
    </button>
  )
}

/** Внешняя ссылка в виде кнопки баннера: всегда в новой вкладке. */
export function BannerLink({ disabled = false, className, children, ...props }: BannerLinkProps) {
  const rootCn = cn(
    ACTION_BASE,
    'hover:bg-ghost-hover active:bg-ghost-pressed',
    disabled && 'pointer-events-none opacity-60',
    className,
  )
  const tabIndex = disabled ? -1 : undefined

  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={rootCn}
      aria-disabled={disabled}
      tabIndex={tabIndex}
      {...props}
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  )
}

function BannerDismiss({ onDismiss, label }: BannerDismissProps) {
  if (!onDismiss) return null

  return (
    <IconButton size="sm" label={label} onClick={onDismiss} className="ml-auto">
      <X aria-hidden />
    </IconButton>
  )
}

export function Banner({
  tone,
  icon,
  children,
  actions,
  onDismiss,
  dismissLabel = 'Скрыть',
}: BannerProps) {
  const rootCn = cn(
    'flex min-h-10 w-full animate-fade-in flex-wrap items-center gap-x-3 gap-y-1 border-b border-divider-soft px-4 py-2 typo-detail narrow:px-3',
    TONE_CLASSES[tone],
  )
  const iconCn = cn('flex shrink-0', ICON_CLASSES[tone])

  return (
    <div className={rootCn}>
      <span className={iconCn}>{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
      <BannerActions>{actions}</BannerActions>
      <BannerDismiss onDismiss={onDismiss} label={dismissLabel} />
    </div>
  )
}
