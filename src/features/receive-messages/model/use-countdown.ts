import { useEffect, useState } from 'react'

const TICK_MS = 1_000

/** Сколько целых секунд осталось до `targetMs` (не меньше 0); null — отсчёта нет. Тикает раз в секунду. */
export function useCountdown(targetMs: number | null): number | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (targetMs === null) return
    const tick = () => {
      setNow(Date.now())
    }
    // Нулевой таймер — синхронизировать «сейчас» сразу после смены цели, не дожидаясь первой секунды.
    const syncTimer = setTimeout(tick, 0)
    const interval = setInterval(tick, TICK_MS)
    return () => {
      clearTimeout(syncTimer)
      clearInterval(interval)
    }
  }, [targetMs])

  if (targetMs === null) return null
  return Math.max(0, Math.ceil((targetMs - now) / TICK_MS))
}
