import { afterEach, describe, expect, it, vi } from 'vitest'

import { applyTheme, readAppliedTheme, Theme } from './theme'
import { useThemeStore } from './theme.store'

describe('тема', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete document.documentElement.dataset.theme
  })

  it('читает тему, выставленную inline-скриптом; без неё или с мусором — светлая', () => {
    expect(readAppliedTheme()).toBe(Theme.Light)
    document.documentElement.dataset.theme = 'sepia'
    expect(readAppliedTheme()).toBe(Theme.Light)
    document.documentElement.dataset.theme = 'dark'
    expect(readAppliedTheme()).toBe(Theme.Dark)
  })

  it('toggle переключает тему, ставит её на <html> и запоминает', () => {
    useThemeStore.setState({ theme: Theme.Light })

    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe(Theme.Dark)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('max-chat:theme')).toBe('dark')

    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe(Theme.Light)
  })

  it('хранилище недоступно — тема всё равно применяется', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    applyTheme(Theme.Dark)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
