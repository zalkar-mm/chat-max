import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'

import '@/app/styles/index.css'

async function enableApiMocks() {
  // Условие целиком статическое: в prod-сборку MSW не попадает.
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKS !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

void enableApiMocks().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
