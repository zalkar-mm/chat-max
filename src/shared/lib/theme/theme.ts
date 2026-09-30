export const Theme = {
  Light: 'light',
  Dark: 'dark',
} as const
export type Theme = (typeof Theme)[keyof typeof Theme]

// Ключ совпадает с inline-скриптом в index.html, который выставляет тему до рендера.
const STORAGE_KEY = 'max-chat:theme'

const isTheme = (value: unknown): value is Theme => value === Theme.Light || value === Theme.Dark

export function readAppliedTheme(): Theme {
  const applied = document.documentElement.dataset.theme
  return isTheme(applied) ? applied : Theme.Light
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Хранилище недоступно (приватный режим) — тема живёт до перезагрузки.
  }
}
