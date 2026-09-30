import { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

import { cn } from '../lib/cn'

import { Gate } from './gate'
import { IconButton } from './icon-button'
import { Input, type InputProps } from './input'

export type SecretInputProps = Omit<InputProps, 'type'> & {
  showLabel: string
  hideLabel: string
}

type TypeByVisibility = Record<'visible' | 'hidden', 'text' | 'password'>

const INPUT_TYPE: TypeByVisibility = { visible: 'text', hidden: 'password' }

export function SecretInput({
  showLabel,
  hideLabel,
  disabled,
  className,
  ...props
}: SecretInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const visibility = isVisible ? 'visible' : 'hidden'
  const toggleLabel = isVisible ? hideLabel : showLabel
  const inputCn = cn('pr-12', className)

  function handleToggle() {
    setIsVisible((value) => !value)
  }

  return (
    <div className="relative w-full">
      <Input {...props} type={INPUT_TYPE[visibility]} disabled={disabled} className={inputCn} />
      <IconButton
        label={toggleLabel}
        aria-pressed={isVisible}
        disabled={disabled}
        onClick={handleToggle}
        className="absolute top-1/2 right-1 -translate-y-1/2"
      >
        <Gate when={isVisible} fallback={<Eye aria-hidden />}>
          <EyeOff aria-hidden />
        </Gate>
      </IconButton>
    </div>
  )
}
