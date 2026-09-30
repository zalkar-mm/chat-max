import { create } from 'zustand'

import { applyTheme, readAppliedTheme, Theme } from './theme'

type ThemeState = {
  theme: Theme
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: readAppliedTheme(),
  toggle: () => {
    const next = get().theme === Theme.Dark ? Theme.Light : Theme.Dark
    applyTheme(next)
    set({ theme: next })
  },
}))
