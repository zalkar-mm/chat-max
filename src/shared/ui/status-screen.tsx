import { type ReactNode, useEffect, useRef } from 'react'

import { cn } from '../lib/cn'

import { Gate } from './gate'

type StatusScreenTone = 'neutral' | 'negative'

type StatusScreenProps = {
  visual: ReactNode
  tone?: StatusScreenTone
  title: ReactNode
  description: ReactNode
  children: ReactNode
  footnote?: ReactNode
  /** Перевести фокус на заголовок при показе: смена экрана без этого не слышна скринридеру. */
  focusTitle?: boolean
}

const VISUAL_TONE_CLASSES: Record<StatusScreenTone, string> = {
  neutral: 'text-icon-secondary',
  negative: 'text-negative',
}

export function StatusScreen({
  visual,
  tone = 'neutral',
  title,
  description,
  children,
  footnote,
  focusTitle = false,
}: StatusScreenProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus()
  }, [focusTitle, title])

  const visualCn = cn(
    'flex size-24 shrink-0 items-center justify-center rounded-full bg-tertiary',
    VISUAL_TONE_CLASSES[tone],
  )
  const hasFootnote = footnote !== undefined && footnote !== null

  return (
    <div className="mx-auto flex w-full max-w-(--auth-card-w) flex-col items-center text-center">
      <div className={visualCn}>{visual}</div>
      <h1 ref={titleRef} tabIndex={-1} className="mt-6 typo-subheader text-primary outline-none">
        {title}
      </h1>
      <p className="mt-2 typo-body text-secondary">{description}</p>
      <Gate when={hasFootnote}>
        <p className="mt-2 typo-description text-tertiary">{footnote}</p>
      </Gate>
      <div className="mt-6 flex w-full flex-col gap-2">{children}</div>
    </div>
  )
}
