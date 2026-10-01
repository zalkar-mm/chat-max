import { useEffect } from 'react'
import { Outlet } from 'react-router'

import { startHistoryPersistence } from '@/features/persist-history/model/history-persistence'
import { startReceiving } from '@/features/receive-messages/model/receive-service'
import { startSendQueue } from '@/features/send-message/model/send-queue'
import { RestoreSessionGate } from '@/features/sign-in/restore-session-gate'
import { startSessionCleanup } from '@/features/sign-out/model/session-cleanup'

import { startConnectionTracking } from '@/shared/lib/connection/connection.store'

export function RootLayout() {
  useEffect(() => startConnectionTracking(), [])
  useEffect(() => startSessionCleanup(), [])
  useEffect(() => startHistoryPersistence(), [])
  useEffect(() => startSendQueue(), [])
  useEffect(() => startReceiving(), [])

  return (
    <RestoreSessionGate>
      <Outlet />
    </RestoreSessionGate>
  )
}
