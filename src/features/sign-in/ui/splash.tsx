import { useEffect, useState } from 'react'

import { Logo } from '@/shared/ui/logo'
import { Spinner } from '@/shared/ui/spinner'

// Быстрая проверка не должна мигать сплэшем: до этой задержки экран просто пустой.
const SPLASH_DELAY_MS = 300

export function Splash() {
  const [isVisible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
    }, SPLASH_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (!isVisible) return <div className="h-dvh bg-surface" aria-busy />

  return (
    <div
      className="flex h-dvh flex-col items-center justify-center gap-6 bg-surface"
      aria-busy
      aria-label="Загрузка"
      role="status"
    >
      <Logo />
      <Spinner size={24} className="text-icon-tertiary" />
    </div>
  )
}
