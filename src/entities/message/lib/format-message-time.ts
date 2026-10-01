const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function formatMessageTime(ts: number): string {
  return timeFormat.format(ts)
}
