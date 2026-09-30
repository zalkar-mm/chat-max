import type { Message } from '../model/message.types'

import { startOfDay } from './calendar-day'
import { formatDayLabel } from './format-day-label'

export type MessageRow =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message'
      key: string
      message: Message
      isFirstInGroup: boolean
      isLastInGroup: boolean
    }

function isSameGroup(a: Message | undefined, b: Message | undefined): boolean {
  if (a === undefined || b === undefined) return false
  return a.direction === b.direction && startOfDay(a.createdAt) === startOfDay(b.createdAt)
}

export function buildMessageRows(messages: readonly Message[], now: number): MessageRow[] {
  const sorted = messages.toSorted((a, b) => a.createdAt - b.createdAt)
  const rows: MessageRow[] = []

  sorted.forEach((message, index) => {
    const previous = sorted[index - 1]
    const next = sorted[index + 1]
    const day = startOfDay(message.createdAt)

    if (previous === undefined || startOfDay(previous.createdAt) !== day) {
      rows.push({ kind: 'day', key: `day-${day}`, label: formatDayLabel(message.createdAt, now) })
    }

    rows.push({
      kind: 'message',
      key: message.id,
      message,
      isFirstInGroup: !isSameGroup(previous, message),
      isLastInGroup: !isSameGroup(message, next),
    })
  })

  return rows
}
