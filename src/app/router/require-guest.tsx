import { Navigate, Outlet } from 'react-router'

import { useIsSignedIn } from '@/entities/session/model/session.store'

import { ROUTES } from '@/shared/consts/routes'

export function RequireGuest() {
  const isSignedIn = useIsSignedIn()
  if (isSignedIn) return <Navigate to={ROUTES.CHATS} replace />
  return <Outlet />
}
