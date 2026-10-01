import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Message } from '../model/message.types'

import { MessageBubble } from './message-bubble'

const CREATED_AT = new Date(2026, 8, 30, 14, 5).getTime()

const outgoing = (delivery: Extract<Message, { direction: 'outgoing' }>['delivery']): Message => ({
  id: 'm1',
  chatId: 'a@c.us',
  text: 'привет',
  createdAt: CREATED_AT,
  direction: 'outgoing',
  content: 'text',
  delivery,
})

const incoming = (text: string): Message => ({
  id: 'm2',
  chatId: 'a@c.us',
  text,
  createdAt: CREATED_AT,
  direction: 'incoming',
  content: 'text',
  idMessage: 'X1',
})

describe('MessageBubble', () => {
  it('показывает HTML буквально, не как разметку', () => {
    render(<MessageBubble senderLabel="Анна" message={incoming('<b>привет</b>')} isLastInGroup />)
    expect(screen.getByText('<b>привет</b>')).toBeInTheDocument()
    expect(screen.queryByText('привет', { selector: 'b' })).not.toBeInTheDocument()
  })

  it('сохраняет переносы строк', () => {
    render(<MessageBubble senderLabel="Анна" message={incoming('первая\nвторая')} isLastInGroup />)
    const text = screen.getByText(/первая/)
    expect(text.textContent).toContain('\n')
    expect(text.textContent).toBe('первая\nвторая')
  })

  it.each([
    [outgoing({ status: 'sending' }), '14:05, отправляется'],
    [outgoing({ status: 'sent', idMessage: 'W1' }), '14:05, отправлено'],
    [outgoing({ status: 'failed', failure: 'offline' }), '14:05, не отправлено'],
    [incoming('привет'), '14:05'],
  ])('подписывает мету времени и статуса: %#', (message, label) => {
    render(<MessageBubble senderLabel="Анна" message={message} isLastInGroup={false} />)
    const time = screen.getByText('14:05')
    expect(time.parentElement?.textContent).toBe(label)
  })

  it('рендерит footer и aside', () => {
    render(
      <MessageBubble
        senderLabel="Анна"
        message={outgoing({ status: 'failed', failure: 'offline' })}
        isLastInGroup
        aside={<span>иконка ошибки</span>}
        footer={<span>Нет подключения</span>}
      />,
    )
    expect(screen.getByText('иконка ошибки')).toBeInTheDocument()
    expect(screen.getByText('Нет подключения')).toBeInTheDocument()
  })

  it.each([
    [incoming('привет'), 'Анна, 14:05: привет'],
    [outgoing({ status: 'delivered', idMessage: 'W1' }), 'Вы, 14:05, доставлено: '],
  ])('озвучивает автора, время и статус: %#', (message, prefix) => {
    render(<MessageBubble senderLabel="Анна" message={message} isLastInGroup />)
    expect(screen.getByRole('article')).toHaveAccessibleName(new RegExp(`^${prefix}`))
  })
})
