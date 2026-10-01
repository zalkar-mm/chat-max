import type { ReactNode } from 'react'

import { claimTab } from './model/tab-leadership'
import { useIsTabActive } from './model/tab-leadership.store'
import { OtherTabScreen } from './ui/other-tab-screen'

type TabLeadershipGateProps = {
  children: ReactNode
  signOutAction: ReactNode
}

/** Неактивная вкладка вместо приложения показывает «Открыто в другой вкладке». */
export function TabLeadershipGate({ children, signOutAction }: TabLeadershipGateProps) {
  const isActive = useIsTabActive()
  if (isActive) return children
  return <OtherTabScreen onUseHere={claimTab} signOutAction={signOutAction} />
}
