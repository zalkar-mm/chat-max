import { Navigate, type RouteObject } from 'react-router'

import { ROUTES } from '@/shared/consts/routes'

import { AppCrashScreen } from '../crash/app-crash-screen'

import { RequireGuest } from './require-guest'
import { RequireSession } from './require-session'
import { RootLayout } from './root-layout'
import { RouteLoadingFallback } from './route-loading-fallback'

// Страницы грузятся отдельными чанками: вход не тянет код чатов, и наоборот (NFR-PERF, начальный JS).
const loadSignInPage = async () => {
  const { SignInPage } = await import('@/pages/sign-in/sign-in.page')
  return { Component: SignInPage }
}

const loadChatsPage = async () => {
  const { ChatsPage } = await import('@/pages/chats/chats.page')
  return { Component: ChatsPage }
}

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <AppCrashScreen />,
    HydrateFallback: RouteLoadingFallback,
    children: [
      {
        element: <RequireGuest />,
        children: [{ path: ROUTES.SIGN_IN, lazy: loadSignInPage }],
      },
      {
        element: <RequireSession />,
        children: [
          { path: ROUTES.CHATS, lazy: loadChatsPage },
          { path: ROUTES.CHAT_PATTERN, lazy: loadChatsPage },
        ],
      },
      { path: '*', element: <Navigate to={ROUTES.CHATS} replace /> },
    ],
  },
]
