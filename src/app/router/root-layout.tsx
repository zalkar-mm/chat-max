import { Outlet } from 'react-router'

import { RestoreSessionGate } from '@/features/sign-in/restore-session-gate'

export function RootLayout() {
  return (
    <RestoreSessionGate>
      <Outlet />
    </RestoreSessionGate>
  )
}
