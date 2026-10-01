import { useSyncExternalStore } from 'react'

const TICK_MS = 60_000

const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  timer ??= setInterval(() => {
    listeners.forEach((notify) => {
      notify()
    })
  }, TICK_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

// Снимок округлён до минуты: стабилен между рендерами и достаточно точен для «14:05 / вчера / Сегодня».
const getSnapshot = () => Math.floor(Date.now() / TICK_MS) * TICK_MS

/** Текущее время (с точностью до минуты) для подписей. Все подписчики делят один таймер. */
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
