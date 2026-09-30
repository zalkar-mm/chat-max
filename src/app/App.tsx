import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { QueryProvider } from './providers/query-provider'
import { routes } from './router/routes'

export function App() {
  const [router] = useState(() => createBrowserRouter(routes))

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}
