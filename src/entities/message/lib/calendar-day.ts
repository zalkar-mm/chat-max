const DAY_MS = 24 * 60 * 60 * 1000

export function startOfDay(ts: number): number {
  const date = new Date(ts)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Сколько календарных дней `ts` отстоит от `now` в прошлое (0 — тот же день). */
export function daysAgo(ts: number, now: number): number {
  // round, а не floor: при переходе на летнее время сутки длятся 23 или 25 часов.
  return Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS)
}
