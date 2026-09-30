import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

export type TextareaProps = ComponentProps<'textarea'> & {
  invalid?: boolean
}

export function Textarea({ invalid = false, className, ...props }: TextareaProps) {
  const rootCn = cn(
    'block w-full min-w-0 resize-none rounded-m border-none bg-input px-3.5 py-2.5 typo-body text-primary outline-none placeholder:text-tertiary',
    'focus:ring-2 focus:ring-accent focus-visible:outline-none',
    'disabled:cursor-not-allowed',
    invalid && 'ring-2 ring-negative focus:ring-negative',
    className,
  )

  return <textarea className={rootCn} aria-invalid={invalid || undefined} {...props} />
}
