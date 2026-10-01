import { useEffect } from 'react'
import { Outlet } from 'react-router'

import { startHistoryPersistence } from '@/features/persist-history/model/history-persistence'
import { startReceiving } from '@/features/receive-messages/model/receive-service'
import { startSendQueue } from '@/features/send-message/model/send-queue'
import { RestoreSessionGate } from '@/features/sign-in/restore-session-gate'
import { startSessionCleanup } from '@/features/sign-out/model/session-cleanup'
import { startTabLeadership } from '@/features/tab-leadership/model/tab-leadership'
import { useIsTabActive } from '@/features/tab-leadership/model/tab-leadership.store'

import { startConnectionTracking } from '@/shared/lib/connection/connection.store'

/** Сервис, который работает только в активной вкладке: в неактивной — ни запросов, ни записи истории. */
const whileActive = (isActive: boolean, start: () => () => void) => (isActive ? start() : undefined)

export function RootLayout() {
  const isTabActive = useIsTabActive()

  useEffect(() => startTabLeadership(), [])
  useEffect(() => startConnectionTracking(), [])
  useEffect(() => startSessionCleanup(), [])
  // Порядок важен: при возврате активности история перечитывается до того, как пойдёт получение.
  useEffect(() => whileActive(isTabActive, startHistoryPersistence), [isTabActive])
  useEffect(() => whileActive(isTabActive, startSendQueue), [isTabActive])
  useEffect(() => whileActive(isTabActive, startReceiving), [isTabActive])

  return (
    <RestoreSessionGate>
      <Outlet />
    </RestoreSessionGate>
  )
}
