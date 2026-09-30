import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  addOutgoingMessage,
  clearMessages,
  getMessage,
  markMessageFailed,
  markMessageSending,
  markMessageSent,
  useChatMessageIds,
  useLastMessage,
  useMessageStore,
} from './message.store'
import type { IncomingMessage } from './message.types'

const NOW = new Date(2026, 8, 30, 14, 5).getTime()

const addIncoming = (message: IncomingMessage) => {
  useMessageStore.setState((state) => ({
    byId: { ...state.byId, [message.id]: message },
    idsByChat: {
      ...state.idsByChat,
      [message.chatId]: [...(state.idsByChat[message.chatId] ?? []), message.id],
    },
  }))
}

describe('message.store', () => {
  it('добавляет исходящее сообщение со статусом sending в конец чата', () => {
    const first = addOutgoingMessage({ chatId: 'a@c.us', text: 'раз', now: NOW })
    const second = addOutgoingMessage({ chatId: 'a@c.us', text: 'два', now: NOW + 1 })

    expect(first.delivery).toEqual({ status: 'sending' })
    expect(first.id).not.toBe(second.id)
    expect(useMessageStore.getState().idsByChat['a@c.us']).toEqual([first.id, second.id])
    expect(getMessage(second.id)).toMatchObject({ text: 'два', direction: 'outgoing' })
  })

  it('переводит сообщение в sent с idMessage', () => {
    const { id } = addOutgoingMessage({ chatId: 'a@c.us', text: 'привет', now: NOW })
    markMessageSent(id, 'BAE5')
    expect(getMessage(id)).toMatchObject({ delivery: { status: 'sent', idMessage: 'BAE5' } })
  })

  it('повтор после ошибки сохраняет позицию и не дублирует сообщение', () => {
    const failed = addOutgoingMessage({ chatId: 'a@c.us', text: 'раз', now: NOW })
    const next = addOutgoingMessage({ chatId: 'a@c.us', text: 'два', now: NOW + 1 })
    markMessageFailed(failed.id, 'offline')
    expect(getMessage(failed.id)).toMatchObject({
      delivery: { status: 'failed', failure: 'offline' },
    })

    markMessageSending(failed.id)

    expect(getMessage(failed.id)).toMatchObject({ delivery: { status: 'sending' } })
    expect(useMessageStore.getState().idsByChat['a@c.us']).toEqual([failed.id, next.id])
  })

  it('не меняет статус у входящего сообщения', () => {
    addIncoming({
      id: 'in-1',
      chatId: 'a@c.us',
      text: 'привет',
      createdAt: NOW,
      direction: 'incoming',
      idMessage: 'X1',
    })
    markMessageFailed('in-1', 'failed')
    expect(getMessage('in-1')).not.toHaveProperty('delivery')
  })

  it('неизвестный id — null и без изменений', () => {
    const before = useMessageStore.getState()
    markMessageSent('missing', 'X')
    expect(getMessage('missing')).toBeNull()
    expect(useMessageStore.getState()).toBe(before)
  })

  it('clearMessages очищает всё', () => {
    const { id } = addOutgoingMessage({ chatId: 'a@c.us', text: 'раз', now: NOW })
    clearMessages()
    expect(getMessage(id)).toBeNull()
    expect(useMessageStore.getState().idsByChat).toEqual({})
  })

  it('useChatMessageIds для пустого чата возвращает стабильную ссылку', () => {
    const { result, rerender } = renderHook(() => useChatMessageIds('empty@c.us'))
    const first = result.current
    rerender()
    expect(result.current).toEqual([])
    expect(result.current).toBe(first)
  })

  it('useLastMessage возвращает последнее сообщение чата', () => {
    const { result } = renderHook(() => useLastMessage('a@c.us'))
    expect(result.current).toBeNull()

    act(() => {
      addOutgoingMessage({ chatId: 'a@c.us', text: 'раз', now: NOW })
      addOutgoingMessage({ chatId: 'a@c.us', text: 'два', now: NOW + 1 })
    })

    expect(result.current).toMatchObject({ text: 'два' })
  })
})
