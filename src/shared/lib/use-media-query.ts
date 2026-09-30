import { useSyncExternalStore } from 'react'

export const DESKTOP_MEDIA_QUERY = '(min-width: 900px)'

export function useMediaQuery(query: string) {
  const subscribe = (onChange: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }
  const getSnapshot = () => window.matchMedia(query).matches

  return useSyncExternalStore(subscribe, getSnapshot)
}
