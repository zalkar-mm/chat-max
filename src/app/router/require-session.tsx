import { Navigate, Outlet } from 'react-router'

import { useIsSignedIn } from '@/entities/session/model/session.store'

import { ROUTES } from '@/shared/consts/routes'

export function RequireSession() {
  const isSignedIn = useIsSignedIn()
  if (!isSignedIn) return <Navigate to={ROUTES.SIGN_IN} replace />
  return <Outlet />
}
