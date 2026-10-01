import type { ReactNode } from 'react'

import { claimTab } from './model/tab-leadership'
import { useIsTabSwitching, useTabStatus } from './model/tab-leadership.store'
import { OtherTabScreen } from './ui/other-tab-screen'

type TabLeadershipGateProps = {
  children: ReactNode
  signOutAction: ReactNode
}

/**
 * Неактивная вкладка вместо приложения показывает «Открыто в другой вкладке».
 * Пока вкладка забирает сессию (до 300 мс), экран чатов не рисуется: история ещё может обновиться.
 */
export function TabLeadershipGate({ children, signOutAction }: TabLeadershipGateProps) {
  const status = useTabStatus()
  const isSwitching = useIsTabSwitching()

  if (status === 'active') return children
  if (status === 'claiming' && !isSwitching) return null
  return (
    <OtherTabScreen onUseHere={claimTab} isSwitching={isSwitching} signOutAction={signOutAction} />
  )
}
