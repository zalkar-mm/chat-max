import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import '@testing-library/jest-dom/vitest'
import './zustand-mock'

import { server } from '@/mocks/node'
import { resetScenarios } from '@/mocks/scenarios'

// Интеграционные сценарии на холодном старте под нагрузкой не укладываются в 1 с по умолчанию.
configure({ asyncUtilTimeout: 3_000 })

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
  server.events.removeAllListeners()
  resetScenarios()
  sessionStorage.clear()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})
