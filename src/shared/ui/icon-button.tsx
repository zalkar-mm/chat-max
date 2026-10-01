import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

type IconButtonSize = 'md' | 'sm'
type IconButtonVariant = 'ghost' | 'accent'

export type IconButtonProps = ComponentProps<'button'> & {
  label: string
  size?: IconButtonSize
  variant?: IconButtonVariant
}

// На mobile область нажатия не меньше --touch-min 44×44 (DS §1 «Касания»).
const SIZE_CLASSES: Record<IconButtonSize, string> = {
  md: 'size-(--touch-min) md:size-10 [&_svg]:size-5',
  sm: 'size-(--touch-min) md:size-8 [&_svg]:size-4',
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: cn(
    'rounded-m bg-transparent text-icon-secondary',
    'enabled:hover:bg-ghost-hover enabled:hover:text-icon-primary enabled:active:bg-ghost-pressed',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ),
  // Круглая кнопка на акценте (отправка сообщения, DESIGN §4.7).
  accent: cn(
    'rounded-full bg-accent text-white',
    'enabled:hover:bg-accent-hover enabled:active:bg-accent-pressed',
    'disabled:cursor-default disabled:bg-button-primary-disabled disabled:[&_svg]:opacity-70',
  ),
}

export function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  type = 'button',
  className,
  children,
  ...props
}: IconButtonProps) {
  const rootCn = cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )

  return (
    <button type={type} className={rootCn} aria-label={label} {...props}>
      {children}
    </button>
  )
}
