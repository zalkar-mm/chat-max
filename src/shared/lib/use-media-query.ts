import { useSyncExternalStore } from 'react'

export const DESKTOP_MEDIA_QUERY = '(min-width: 900px)'

// Подписка на запрос создаётся один раз: иначе useSyncExternalStore переподписывается каждый рендер.
const subscriptions = new Map<string, (onChange: () => void) => () => void>()

function getSubscribe(query: string) {
  const cached = subscriptions.get(query)
  if (cached) return cached

  const subscribe = (onChange: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }
  subscriptions.set(query, subscribe)
  return subscribe
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(getSubscribe(query), () => window.matchMedia(query).matches)
}
