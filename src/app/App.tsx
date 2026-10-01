import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { QueryProvider } from './providers/query-provider'
import { routes } from './router/routes'

// Сборку можно разместить в подпапке (BASE_PATH при сборке); по умолчанию — корень сайта.
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export function App() {
  const [router] = useState(() => createBrowserRouter(routes, { basename: ROUTER_BASENAME }))

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
