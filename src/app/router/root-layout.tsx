import { useEffect } from 'react'
import { Outlet } from 'react-router'

import { RestoreSessionGate } from '@/features/sign-in/restore-session-gate'

import { startConnectionTracking } from '@/shared/lib/connection/connection.store'

export function RootLayout() {
  useEffect(() => startConnectionTracking(), [])

  return (
    <RestoreSessionGate>
      <Outlet />
    </RestoreSessionGate>
  )
}
