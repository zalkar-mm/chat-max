import { describe, expect, it } from 'vitest'

import type { Message } from '../model/message.types'

import { buildMessageRows } from './group-messages'

const at = (day: number, hours: number, minutes = 0) =>
  new Date(2026, 8, day, hours, minutes).getTime()

const NOW = at(30, 14, 5)

const outgoing = (id: string, createdAt: number): Message => ({
  id,
  chatId: 'a@c.us',
  text: id,
  createdAt,
  direction: 'outgoing',
  content: 'text',
  delivery: { status: 'sent', idMessage: `w-${id}` },
})

const incoming = (id: string, createdAt: number): Message => ({
  id,
  chatId: 'a@c.us',
  text: id,
  createdAt,
  direction: 'incoming',
  content: 'text',
  idMessage: `w-${id}`,
})

const summary = (messages: readonly Message[]) =>
  buildMessageRows(messages, NOW).map((row) => {
    if (row.kind === 'day') return `[${row.label}]`
    const first = row.isFirstInGroup ? 'F' : '-'
    const last = row.isLastInGroup ? 'L' : '-'
    return `${row.message.id}:${first}${last}`
  })

describe('buildMessageRows', () => {
  it('пустой список — пустые строки', () => {
    expect(buildMessageRows([], NOW)).toEqual([])
  })

  it('одиночное сообщение — разделитель дня и первое/последнее в группе', () => {
    expect(summary([outgoing('a', at(30, 10))])).toEqual(['[Сегодня]', 'a:FL'])
  })

  it('группирует подряд идущие сообщения одного направления', () => {
    expect(
      summary([
        outgoing('a', at(30, 10)),
        outgoing('b', at(30, 10, 1)),
        outgoing('c', at(30, 10, 2)),
        incoming('d', at(30, 10, 3)),
        outgoing('e', at(30, 10, 4)),
      ]),
    ).toEqual(['[Сегодня]', 'a:F-', 'b:--', 'c:-L', 'd:FL', 'e:FL'])
  })

  it('смена дня вставляет разделитель и разрывает группу', () => {
    expect(
      summary([outgoing('b', at(30, 9)), outgoing('a', at(29, 23)), outgoing('c', at(27, 8))]),
    ).toEqual(['[27 сентября]', 'c:FL', '[Вчера]', 'a:FL', '[Сегодня]', 'b:FL'])
  })

  it('сортирует по времени устойчиво: при равном времени — порядок вставки', () => {
    const rows = buildMessageRows(
      [outgoing('x', at(30, 10)), outgoing('y', at(30, 10)), outgoing('z', at(30, 9))],
      NOW,
    )
    expect(rows.map((row) => row.key)).toEqual([expect.stringMatching(/^day-/), 'z', 'x', 'y'])
  })
})
