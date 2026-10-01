import { daysAgo } from './calendar-day'
import { formatMessageTime } from './format-message-time'

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
})

export function formatChatListTime(ts: number, now: number): string {
  const days = daysAgo(ts, now)
  if (days <= 0) return formatMessageTime(ts)
  if (days === 1) return 'вчера'
  return dateFormat.format(ts)
}
