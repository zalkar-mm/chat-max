import { describe, expect, it } from 'vitest'

import { formatChatListTime } from './format-chat-list-time'
import { formatDayLabel } from './format-day-label'
import { formatMessageTime } from './format-message-time'

const at = (year: number, month: number, day: number, hours = 12, minutes = 0) =>
  new Date(year, month, day, hours, minutes).getTime()

const NOW = at(2026, 8, 30, 14, 5)

describe('formatMessageTime', () => {
  it('форматирует время как ЧЧ:ММ', () => {
    expect(formatMessageTime(at(2026, 8, 30, 14, 5))).toBe('14:05')
    expect(formatMessageTime(at(2026, 8, 30, 9, 7))).toBe('09:07')
  })
})

describe('formatChatListTime', () => {
  it('сегодня — время', () => {
    expect(formatChatListTime(at(2026, 8, 30, 0, 1), NOW)).toBe('00:01')
  })

  it('вчера — «вчера», даже если прошло меньше суток', () => {
    expect(formatChatListTime(at(2026, 8, 29, 23, 59), NOW)).toBe('вчера')
  })

  it('раньше — дата дд.ММ.гг', () => {
    expect(formatChatListTime(at(2026, 8, 28), NOW)).toBe('28.09.26')
    expect(formatChatListTime(at(2025, 11, 31), NOW)).toBe('31.12.25')
  })
})

describe('formatDayLabel', () => {
  it('сегодня и вчера — словами', () => {
    expect(formatDayLabel(at(2026, 8, 30, 1), NOW)).toBe('Сегодня')
    expect(formatDayLabel(at(2026, 8, 29, 23), NOW)).toBe('Вчера')
  })

  it('в этом году — число и месяц', () => {
    expect(formatDayLabel(at(2026, 8, 27), NOW)).toBe('27 сентября')
    expect(formatDayLabel(at(2026, 0, 1), NOW)).toBe('1 января')
  })

  it('прошлый год — с годом без «г.»', () => {
    expect(formatDayLabel(at(2025, 8, 27), NOW)).toBe('27 сентября 2025')
  })

  it('вчера на стыке годов — «Вчера»', () => {
    expect(formatDayLabel(at(2025, 11, 31, 23), at(2026, 0, 1, 0, 30))).toBe('Вчера')
  })
})
