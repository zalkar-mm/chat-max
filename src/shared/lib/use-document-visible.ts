import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => {
    document.removeEventListener('visibilitychange', onChange)
  }
}

const getSnapshot = () => document.visibilityState === 'visible'

// На сервере документа нет — считаем вкладку видимой.
const getServerSnapshot = () => true

/** Видна ли вкладка браузера (Page Visibility API). */
export function useDocumentVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
