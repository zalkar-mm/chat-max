import type { ReactNode } from 'react'

import { Check } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'

import { Gate } from './gate'

type CheckboxProps = {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: ReactNode
  hint?: ReactNode
  disabled?: boolean
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  hint,
  disabled = false,
}: CheckboxProps) {
  const hintId = `${id}-hint`
  const hasHint = Boolean(hint)
  const describedBy = hasHint ? hintId : undefined

  function handleCheckedChange(value: boolean | 'indeterminate') {
    onCheckedChange(value === true)
  }

  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        aria-describedby={describedBy}
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-checkbox border-[1.5px] border-checkbox bg-transparent text-white transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="flex min-w-0 flex-col">
        <label htmlFor={id} className="cursor-pointer typo-body text-primary">
          {label}
        </label>
        <Gate when={hasHint}>
          <p id={hintId} className="mt-0.5 typo-description text-tertiary">
            {hint}
          </p>
        </Gate>
      </div>
    </div>
  )
}
