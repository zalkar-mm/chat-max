import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { addIncomingMessage } from '@/entities/message/model/message.store'

import { MessageFeed } from './message-feed'

const CHAT_ID = '191234567'

const receive = (idMessage: string, text: string) => {
  act(() => {
    addIncomingMessage({
      chatId: CHAT_ID,
      idMessage,
      text,
      content: 'text',
      createdAt: Date.now(),
    })
  })
}

const scrollFeedUp = () => {
  const feed = screen.getByRole('log', { name: 'Сообщения' }).parentElement
  if (!feed) throw new Error('Нет контейнера прокрутки ленты')
  Object.defineProperty(feed, 'scrollHeight', { configurable: true, value: 2000 })
  Object.defineProperty(feed, 'clientHeight', { configurable: true, value: 500 })
  Object.defineProperty(feed, 'scrollTop', { configurable: true, writable: true, value: 0 })
  fireEvent.scroll(feed)
}

describe('MessageFeed — кнопка «↓ Новые сообщения»', () => {
  it('пользователь внизу → новое входящее прокручивается в вид, кнопки нет', () => {
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo')
    render(<MessageFeed chatId={CHAT_ID} />)
    receive('in-1', 'Привет')
    expect(screen.getByText('Привет')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    expect(screen.queryByRole('button', { name: /прокрутить вниз/ })).not.toBeInTheDocument()
  })

  it('прокрутил вверх → лента не прыгает, кнопка с числом; нажатие → вниз и кнопка скрыта', async () => {
    render(<MessageFeed chatId={CHAT_ID} />)
    scrollFeedUp()
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo')

    receive('in-1', 'Первое')
    expect(scrollTo).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: '1 новых сообщения, прокрутить вниз' }),
    ).toBeInTheDocument()

    receive('in-2', 'Второе')
    const button = screen.getByRole('button', { name: /прокрутить вниз/ })
    expect(button).toHaveAccessibleName('2 новых сообщения, прокрутить вниз')

    await userEvent.click(button)
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 2000 }))
    expect(screen.queryByRole('button', { name: /прокрутить вниз/ })).not.toBeInTheDocument()
  })

  it('сам доскроллил до низа → кнопка скрывается', () => {
    render(<MessageFeed chatId={CHAT_ID} />)
    scrollFeedUp()
    receive('in-1', 'Первое')
    const feed = screen.getByRole('log', { name: 'Сообщения' }).parentElement
    if (!feed) throw new Error('Нет контейнера прокрутки ленты')
    feed.scrollTop = 1450
    fireEvent.scroll(feed)
    expect(screen.queryByRole('button', { name: /прокрутить вниз/ })).not.toBeInTheDocument()
  })
})
