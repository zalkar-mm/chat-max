import { LogOut } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'

import { useSignOut } from './model/use-sign-out'

type SignOutButtonProps = {
  appearance?: 'icon' | 'button'
}

export function SignOutButton({ appearance = 'icon' }: SignOutButtonProps) {
  const signOut = useSignOut()

  if (appearance === 'button') {
    return (
      <Button variant="secondary" className="w-full" onClick={signOut}>
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
