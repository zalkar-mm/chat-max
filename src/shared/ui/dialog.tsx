import type { ComponentProps, ReactNode } from 'react'

import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '../lib/cn'

import { Gate } from './gate'
import { IconButton } from './icon-button'

export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close

type DialogContentPrimitiveProps = ComponentProps<typeof DialogPrimitive.Content>

type DialogContentProps = {
  title: ReactNode
  children: ReactNode
  className?: string
  closeLabel?: string
  onEscapeKeyDown?: DialogContentPrimitiveProps['onEscapeKeyDown']
  onInteractOutside?: DialogContentPrimitiveProps['onInteractOutside']
  onCloseAutoFocus?: DialogContentPrimitiveProps['onCloseAutoFocus']
  onOpenAutoFocus?: DialogContentPrimitiveProps['onOpenAutoFocus']
  isCloseDisabled?: boolean
  hideCloseButton?: boolean
}

export function DialogContent({
  title,
  children,
  className,
  closeLabel = 'Закрыть',
  onEscapeKeyDown,
  onInteractOutside,
  onCloseAutoFocus,
  onOpenAutoFocus,
  isCloseDisabled = false,
  hideCloseButton = false,
}: DialogContentProps) {
  const contentCn = cn(
    'fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-y-auto bg-primary px-4 pb-4 focus:outline-none',
    'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-w-(--auth-card-w) md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:bg-modal md:p-6 md:shadow-modal',
    className,
  )

  const showCloseButton = !hideCloseButton

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
      <DialogPrimitive.Content
        className={contentCn}
        onEscapeKeyDown={onEscapeKeyDown}
        onInteractOutside={onInteractOutside}
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={onOpenAutoFocus}
        aria-describedby={undefined}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 md:mb-4 md:h-auto">
          <DialogPrimitive.Title className="min-w-0 flex-1 typo-title text-primary">
            {title}
          </DialogPrimitive.Title>
          <Gate when={showCloseButton}>
            <DialogPrimitive.Close asChild>
              <IconButton
                label={closeLabel}
                disabled={isCloseDisabled}
                className="order-first -ml-2 md:order-last md:-mt-2 md:-mr-2 md:ml-0"
              >
                <X aria-hidden />
              </IconButton>
            </DialogPrimitive.Close>
          </Gate>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  const rootCn = cn('typo-body text-secondary', className)

  return <DialogPrimitive.Description className={rootCn} {...props} />
}
