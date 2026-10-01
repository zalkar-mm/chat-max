import { Navigate, Outlet } from 'react-router'

import { SignOutButton } from '@/features/sign-out/sign-out-button'
import { TabLeadershipGate } from '@/features/tab-leadership/tab-leadership-gate'

import { useIsSignedIn } from '@/entities/session/model/session.store'

import { ROUTES } from '@/shared/consts/routes'

export function RequireSession() {
  const isSignedIn = useIsSignedIn()
  if (!isSignedIn) return <Navigate to={ROUTES.SIGN_IN} replace />
  return (
    <TabLeadershipGate signOutAction={<SignOutButton appearance="ghost" />}>
      <Outlet />
    </TabLeadershipGate>
  )
}
