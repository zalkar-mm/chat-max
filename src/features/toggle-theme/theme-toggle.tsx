import { Moon, Sun } from 'lucide-react'

import { Theme } from '@/shared/lib/theme/theme'
import { useThemeStore } from '@/shared/lib/theme/theme.store'
import { Gate } from '@/shared/ui/gate'
import { IconButton } from '@/shared/ui/icon-button'

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggle = useThemeStore((state) => state.toggle)
  const isDark = theme === Theme.Dark
  const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему'

  return (
    <IconButton label={label} onClick={toggle}>
      <Gate when={isDark} fallback={<Moon aria-hidden />}>
        <Sun aria-hidden />
      </Gate>
    </IconButton>
  )
}
