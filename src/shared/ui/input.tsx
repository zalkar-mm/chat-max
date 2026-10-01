import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

export type InputProps = ComponentProps<'input'> & {
  invalid?: boolean
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  const rootCn = cn(
    'h-12 w-full min-w-0 rounded-m border-none bg-input px-4 typo-input text-primary outline-none placeholder:text-tertiary',
    'focus:ring-2 focus:ring-accent focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-60',
    invalid && 'ring-2 ring-negative focus:ring-negative',
    className,
  )

  return <input className={rootCn} aria-invalid={invalid || undefined} {...props} />
}
