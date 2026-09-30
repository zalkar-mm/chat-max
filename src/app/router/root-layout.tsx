import { useEffect } from 'react'
import { Outlet } from 'react-router'

import { startSendQueue } from '@/features/send-message/model/send-queue'
import { RestoreSessionGate } from '@/features/sign-in/restore-session-gate'

import { startConnectionTracking } from '@/shared/lib/connection/connection.store'

export function RootLayout() {
  useEffect(() => startConnectionTracking(), [])
  useEffect(() => startSendQueue(), [])

  return (
    <RestoreSessionGate>
      <Outlet />
    </RestoreSessionGate>
  )
}
