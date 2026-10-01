import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ensureChat, incrementUnread } from '@/entities/chat/model/chat.store'

import { UnreadTitle } from './unread-title'

const addUnread = (chatId: string, count: number) => {
  ensureChat({ chatId, phone: null, name: null, now: 0 })
  for (let index = 0; index < count; index += 1) incrementUnread(chatId)
}

const tabTitle = () => document.querySelector('title')?.textContent

describe('UnreadTitle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('скрытая вкладка с непрочитанными → «(2) MAX-чат»', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      addUnread('1', 1)
      addUnread('2', 1)
    })
    render(<UnreadTitle />)
    expect(tabTitle()).toBe('(2) MAX-чат')
  })

  it('видимая вкладка → обычный заголовок', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    act(() => {
      addUnread('1', 2)
    })
    render(<UnreadTitle />)
    expect(tabTitle()).toBe('MAX-чат')
  })

  it('вернулись во вкладку → заголовок обычный', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      addUnread('1', 2)
    })
    render(<UnreadTitle />)
    expect(tabTitle()).toBe('(2) MAX-чат')
    visibility.mockReturnValue('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(tabTitle()).toBe('MAX-чат')
  })
})
