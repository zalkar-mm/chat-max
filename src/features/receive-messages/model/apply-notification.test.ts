import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addChat, getChat, setViewedChat } from '@/entities/chat/model/chat.store'
import {
  addOutgoingMessage,
  getAllMessages,
  markMessageSent,
} from '@/entities/message/model/message.store'

import {
  applyNotification,
  ECHO_CONFIRM_TIMEOUT_MS,
  resetPendingEchoes,
} from './apply-notification'

const echo = (idMessage: string) =>
  ({
    kind: 'outgoingMessage',
    source: 'api',
    idMessage,
    chatId: 'c',
    text: 'Привет',
    content: 'text',
    sentAt: 1,
  }) as const

const incoming = (idMessage: string) =>
  ({
    kind: 'incomingMessage',
    idMessage,
    chatId: 'c',
    phone: null,
    name: null,
    text: 'ответ',
    content: 'text',
    sentAt: 1,
  }) as const

describe('applyNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    addChat({ chatId: 'c', phone: '79991234567', now: 1 })
  })
  afterEach(() => {
    resetPendingEchoes()
    vi.useRealTimers()
  })

  it('эхо уже подтверждённой отправки игнорируется', () => {
    const sent = addOutgoingMessage({ chatId: 'c', text: 'Привет', now: 1 })
    markMessageSent(sent.id, 'api-1')
    applyNotification(echo('api-1'))
    expect(getAllMessages()).toHaveLength(1)
  })

  it('эхо раньше ответа sendMessage: ответ пришёл — дубля нет', async () => {
    const sent = addOutgoingMessage({ chatId: 'c', text: 'Привет', now: 1 })
    applyNotification(echo('api-1'))
    markMessageSent(sent.id, 'api-1')
    await vi.advanceTimersByTimeAsync(ECHO_CONFIRM_TIMEOUT_MS)
    expect(getAllMessages()).toHaveLength(1)
  })

  it('эхо без подтверждения 30 с — показывается как своё сообщение', async () => {
    applyNotification(echo('api-2'))
    await vi.advanceTimersByTimeAsync(ECHO_CONFIRM_TIMEOUT_MS - 1)
    expect(getAllMessages()).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(getAllMessages()).toMatchObject([
      { direction: 'outgoing', delivery: { status: 'sent' } },
    ])
  })

  it('входящее в открытый видимый чат не считается непрочитанным', () => {
    setViewedChat('c')
    applyNotification(incoming('in-1'))
    expect(getChat('c')?.unreadCount).toBe(0)
    setViewedChat(null)
    applyNotification(incoming('in-2'))
    expect(getChat('c')?.unreadCount).toBe(1)
  })
})
