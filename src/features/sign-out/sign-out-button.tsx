import { LogOut } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'

import { useSignOut } from './model/use-sign-out'

type SignOutButtonProps = {
  /** `button` — вторичная кнопка во всю ширину (экран сбоя), `ghost` — под основной кнопкой экрана. */
  appearance?: 'icon' | 'button' | 'ghost'
}

const BUTTON_VARIANT = { button: 'secondary', ghost: 'ghost' } as const

export function SignOutButton({ appearance = 'icon' }: SignOutButtonProps) {
  const signOut = useSignOut()

  if (appearance !== 'icon') {
    return (
      <Button variant={BUTTON_VARIANT[appearance]} className="w-full" onClick={signOut}>
        Выйти
      </Button>
    )
  }

  return (
    <IconButton label="Выйти" onClick={signOut}>
      <LogOut aria-hidden />
    </IconButton>
  )
}
