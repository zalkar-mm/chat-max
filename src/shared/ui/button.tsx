import type { ComponentProps } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/cn'

import { Gate } from './gate'
import { Spinner } from './spinner'

const BOX = 'inline-flex items-center justify-center gap-2 rounded-m px-4 transition-colors'

// eslint-disable-next-line react-refresh/only-export-components -- варианты нужны снаружи (стилизовать ссылку как кнопку)
export const buttonVariants = cva('cursor-pointer select-none', {
  variants: {
    variant: {
      primary: cn(
        BOX,
        'bg-accent text-white enabled:hover:bg-accent-hover enabled:active:bg-accent-pressed',
      ),
      secondary: cn(
        BOX,
        'bg-button-secondary text-primary enabled:hover:bg-button-secondary-hover enabled:active:bg-button-secondary-pressed',
      ),
      ghost: cn(
        BOX,
        'bg-transparent text-primary enabled:hover:bg-ghost-hover enabled:active:bg-ghost-pressed',
      ),
      plain: 'block w-full text-left',
    },
    size: {
      large: '',
      medium: '',
    },
    inactive: {
      true: 'cursor-default',
      false: '',
    },
  },
  compoundVariants: [
    {
      variant: ['primary', 'secondary', 'ghost'],
      size: 'large',
      className: 'h-12 typo-action-large',
    },
    {
      variant: ['primary', 'secondary', 'ghost'],
      size: 'medium',
      className: 'h-10 typo-action-small',
    },
    { variant: 'primary', inactive: true, className: 'bg-button-primary-disabled text-white/70' },
    { variant: ['secondary', 'ghost'], inactive: true, className: 'opacity-60' },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'large',
    inactive: false,
  },
})

type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonProps = ComponentProps<'button'> & {
  variant?: NonNullable<ButtonVariantProps['variant']>
  size?: NonNullable<ButtonVariantProps['size']>
  loading?: boolean
}

export function Button({
  variant,
  size,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const isInactive = disabled && !loading
  const rootCn = cn(buttonVariants({ variant, size, inactive: isInactive }), className)

  return (
    <button
      type={type}
      className={rootCn}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <Gate when={loading}>
        <Spinner size={20} />
      </Gate>
      {children}
    </button>
  )
}
