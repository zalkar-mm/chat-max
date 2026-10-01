import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  addChat,
  clearChats,
  findChatIdByPhone,
  getChat,
  setChatDraft,
  touchChat,
  useChatDraft,
  useSortedChatIds,
} from './chat.store'

const createThree = () => {
  addChat({ chatId: 'a', phone: '79990000001', now: 1 })
  addChat({ chatId: 'b', phone: '79990000002', now: 2 })
  addChat({ chatId: 'c', phone: '375290000003', now: 3 })
}

describe('chat.store', () => {
  beforeEach(() => {
    clearChats()
  })

  it('создаёт чат с отформатированным номером в названии', () => {
    const chat = addChat({ chatId: 'a', phone: '79991234567', now: 10 })
    expect(chat).toEqual({
      id: 'a',
      phone: '79991234567',
      title: '+7 999 123-45-67',
      createdAt: 10,
      lastActivityAt: 10,
    })
    expect(getChat('a')).toEqual(chat)
    expect(findChatIdByPhone('79991234567')).toBe('a')
  })

  it('три созданных чата идут в порядке создания, последний сверху', () => {
    createThree()
    const { result } = renderHook(() => useSortedChatIds())
    expect(result.current).toEqual(['c', 'b', 'a'])
  })

  it('при равном времени активности выше тот, что создан позже', () => {
    addChat({ chatId: 'a', phone: '79990000001', now: 1 })
    addChat({ chatId: 'b', phone: '79990000002', now: 2 })
    touchChat('a', 5)
    touchChat('b', 5)
    const { result } = renderHook(() => useSortedChatIds())
    expect(result.current).toEqual(['b', 'a'])
  })

  it('touchChat поднимает чат наверх и не откатывает время назад', () => {
    createThree()
    const { result } = renderHook(() => useSortedChatIds())
    act(() => {
      touchChat('a', 10)
    })
    expect(result.current).toEqual(['a', 'c', 'b'])
    act(() => {
      touchChat('a', 4)
    })
    expect(getChat('a')?.lastActivityAt).toBe(10)
  })

  it('список не меняет ссылку, пока порядок прежний', () => {
    createThree()
    const { result } = renderHook(() => useSortedChatIds())
    const first = result.current
    act(() => {
      setChatDraft('a', 'черновик')
    })
    expect(result.current).toBe(first)
  })

  it('повторный номер или chatId не создаёт дубль', () => {
    const first = addChat({ chatId: 'a', phone: '79991234567', now: 1 })
    const second = addChat({ chatId: 'a', phone: '79991234567', now: 2 })
    addChat({ chatId: 'a', phone: '89991234567', now: 3 })
    expect(second).toBe(first)
    expect(findChatIdByPhone('89991234567')).toBe('a')
    const { result } = renderHook(() => useSortedChatIds())
    expect(result.current).toEqual(['a'])
  })

  it('хранит черновик отдельно для каждого чата', () => {
    createThree()
    setChatDraft('a', 'привет')
    setChatDraft('b', 'пока')
    expect(renderHook(() => useChatDraft('a')).result.current).toBe('привет')
    expect(renderHook(() => useChatDraft('b')).result.current).toBe('пока')
    expect(renderHook(() => useChatDraft('c')).result.current).toBe('')
  })

  it('clearChats сбрасывает чаты, номера и черновики', () => {
    createThree()
    setChatDraft('a', 'привет')
    clearChats()
    expect(getChat('a')).toBeNull()
    expect(findChatIdByPhone('79990000001')).toBeNull()
    expect(renderHook(() => useChatDraft('a')).result.current).toBe('')
    expect(renderHook(() => useSortedChatIds()).result.current).toEqual([])
  })
})
