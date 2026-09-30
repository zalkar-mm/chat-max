import { create } from 'zustand'

export const ConnectionStatus = {
  Online: 'online',
  Offline: 'offline',
  /** Сеть только что вернулась: короткое «Соединение восстановлено». */
  Restored: 'restored',
} as const
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]

export const RESTORED_VISIBLE_MS = 3_000

type ConnectionState = {
  status: ConnectionStatus
}

export const useConnectionStore = create<ConnectionState>()(() => ({
  status: navigator.onLine ? ConnectionStatus.Online : ConnectionStatus.Offline,
}))

export const useConnectionStatus = () => useConnectionStore((state) => state.status)

/** Слушает online/offline браузера. Возвращает функцию остановки. */
export function startConnectionTracking() {
  let restoredTimer: ReturnType<typeof setTimeout> | null = null

  const clearRestoredTimer = () => {
    if (restoredTimer !== null) clearTimeout(restoredTimer)
    restoredTimer = null
  }

  const handleOffline = () => {
    clearRestoredTimer()
    useConnectionStore.setState({ status: ConnectionStatus.Offline })
  }

  const handleOnline = () => {
    if (useConnectionStore.getState().status !== ConnectionStatus.Offline) return
    useConnectionStore.setState({ status: ConnectionStatus.Restored })
    clearRestoredTimer()
    restoredTimer = setTimeout(() => {
      useConnectionStore.setState({ status: ConnectionStatus.Online })
    }, RESTORED_VISIBLE_MS)
  }

  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  useConnectionStore.setState({
    status: navigator.onLine ? ConnectionStatus.Online : ConnectionStatus.Offline,
  })

  return () => {
    clearRestoredTimer()
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('online', handleOnline)
  }
}
