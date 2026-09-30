import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { server } from '@/mocks/node'
import { resetScenarios } from '@/mocks/scenarios'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetScenarios()
  sessionStorage.clear()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})
