import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import '@testing-library/jest-dom/vitest'
import './zustand-mock'

import { server } from '@/mocks/node'
import { resetScenarios } from '@/mocks/scenarios'

// jsdom не умеет matchMedia: по умолчанию считаем экран мобильным.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

// jsdom без ResizeObserver, а Radix меряет им размеры.
const noop = () => undefined
class ResizeObserverStub {
  observe = noop
  unobserve = noop
  disconnect = noop
}
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub })

// jsdom не умеет прокрутку: заглушка, которую тесты могут подсмотреть через spy.
Element.prototype.scrollTo = noop

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
