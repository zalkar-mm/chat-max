import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

type IconButtonSize = 'md' | 'sm'

export type IconButtonProps = ComponentProps<'button'> & {
  label: string
  size?: IconButtonSize
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  md: 'size-10 [&_svg]:size-5',
  sm: 'size-8 [&_svg]:size-4',
}

export function IconButton({
  label,
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}: IconButtonProps) {
  const rootCn = cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-m bg-transparent text-icon-secondary transition-colors',
    'enabled:hover:bg-ghost-hover enabled:hover:text-icon-primary enabled:active:bg-ghost-pressed',
    'disabled:cursor-not-allowed disabled:opacity-60',
    SIZE_CLASSES[size],
    className,
  )

  return (
    <button type={type} className={rootCn} aria-label={label} {...props}>
      {children}
    </button>
  )
}
