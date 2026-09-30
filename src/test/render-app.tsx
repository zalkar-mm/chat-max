import { StrictMode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { QueryProvider } from '@/app/providers/query-provider'
import { routes } from '@/app/router/routes'

import { initSignInFlow } from '@/features/sign-in/model/sign-in-flow.store'

import { useSessionStore } from '@/entities/session/model/session.store'

type RenderAppOptions = {
  path?: string
  advanceTimers?: (ms: number) => unknown
}

/** Приложение целиком на memory-роутере: сторы сброшены, сессия решается по текущему хранилищу. */
export function renderApp({ path = '/', advanceTimers }: RenderAppOptions = {}) {
  useSessionStore.setState({
    credentials: null,
    instanceState: null,
    isSuspendedBannerDismissed: false,
  })
  initSignInFlow()

  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : {})
  const view = render(
    <StrictMode>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </StrictMode>,
  )
  return { ...view, user, router }
}
