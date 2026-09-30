import { Navigate, type RouteObject } from 'react-router'

import { ChatsPage } from '@/pages/chats/chats.page'
import { SignInPage } from '@/pages/sign-in/sign-in.page'

import { ROUTES } from '@/shared/consts/routes'

import { RequireGuest } from './require-guest'
import { RequireSession } from './require-session'
import { RootLayout } from './root-layout'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        element: <RequireGuest />,
        children: [{ path: ROUTES.SIGN_IN, element: <SignInPage /> }],
      },
      {
        element: <RequireSession />,
        children: [
          { path: ROUTES.CHATS, element: <ChatsPage /> },
          { path: ROUTES.CHAT_PATTERN, element: <ChatsPage /> },
        ],
      },
      { path: '*', element: <Navigate to={ROUTES.CHATS} replace /> },
    ],
  },
]
