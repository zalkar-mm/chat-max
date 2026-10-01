import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { FakeBroadcastChannel } from './fake-broadcast-channel'
import { FakeLockManager } from './fake-lock-manager'

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

// Связь вкладок — в памяти теста (см. fake-broadcast-channel.ts).
Object.defineProperty(globalThis, 'BroadcastChannel', {
  writable: true,
  value: FakeBroadcastChannel,
})

// Web Locks — тоже в памяти: по ним новая вкладка видит, есть ли активная (см. tab-leadership).
const locks = new FakeLockManager()
Object.defineProperty(navigator, 'locks', { configurable: true, value: locks })

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  server.events.removeAllListeners()
  resetScenarios()
  FakeBroadcastChannel.reset()
  locks.reset()
  sessionStorage.clear()
  localStorage.clear()
})

afterAll(() => {
  server.close()
})
