import { daysAgo } from './calendar-day'

const dayMonthFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function formatDayLabel(ts: number, now: number): string {
  const days = daysAgo(ts, now)
  if (days <= 0) return 'Сегодня'
  if (days === 1) return 'Вчера'

  const dayMonth = dayMonthFormat.format(ts)
  const year = new Date(ts).getFullYear()
  if (year === new Date(now).getFullYear()) return dayMonth
  // Intl для ru-RU добавляет к году «г.» — в дизайне год без суффикса.
  return `${dayMonth} ${year}`
}
