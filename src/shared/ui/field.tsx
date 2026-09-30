import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

type FieldMessages = {
  hint?: string | undefined
  error?: string | undefined
}

type FieldProps = FieldMessages & {
  id: string
  label: ReactNode
  children: ReactNode
  className?: string
}

type FieldMessageProps = FieldMessages & {
  id: string
}

// eslint-disable-next-line react-refresh/only-export-components -- хелпер обязан жить рядом с Field: он знает формат id сообщений
export function getFieldDescribedBy(id: string, { hint, error }: FieldMessages) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

function FieldMessage({ id, hint, error }: FieldMessageProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  if (error) {
    return (
      <p id={errorId} className="typo-description text-negative-strong">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={hintId} className="typo-description text-tertiary">
        {hint}
      </p>
    )
  }
  return null
}

export function Field({ id, label, hint, error, children, className }: FieldProps) {
  const rootCn = cn('flex flex-col gap-1.5', className)

  return (
    <div className={rootCn}>
      <label htmlFor={id} className="typo-label text-secondary">
        {label}
      </label>
      {children}
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  )
}
