import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  addChat,
  ensureChat,
  getAllChats,
  getChat,
  hydrateChats,
  incrementUnread,
  markChatRead,
  useTotalUnread,
} from './chat.store'

describe('chat.store — входящие и непрочитанные', () => {
  it('имя собеседника заменяет номер в названии, номер остаётся', () => {
    addChat({ chatId: 'a', phone: '79991234567', now: 1 })
    ensureChat({ chatId: 'a', name: 'Анна', now: 2 })
    expect(getChat('a')).toMatchObject({ title: 'Анна', name: 'Анна', phone: '79991234567' })
  })

  it('чат от входящего без номера называется именем, без имени — идентификатором', () => {
    expect(ensureChat({ chatId: 'x', name: 'Борис', now: 1 }).title).toBe('Борис')
    expect(ensureChat({ chatId: 'y', now: 1 }).title).toBe('y')
  })

  it('счётчик непрочитанных растёт и обнуляется; общий счётчик — сумма', () => {
    addChat({ chatId: 'a', phone: '79990000001', now: 1 })
    addChat({ chatId: 'b', phone: '79990000002', now: 1 })
    incrementUnread('a')
    incrementUnread('a')
    incrementUnread('b')
    expect(renderHook(() => useTotalUnread()).result.current).toBe(3)
    markChatRead('a')
    expect(getChat('a')?.unreadCount).toBe(0)
  })

  it('история восстанавливается с номерами и счётчиками', () => {
    addChat({ chatId: 'a', phone: '79990000001', now: 1 })
    incrementUnread('a')
    const snapshot = getAllChats()
    hydrateChats(snapshot)
    expect(getChat('a')).toMatchObject({ unreadCount: 1, phone: '79990000001' })
  })
})
