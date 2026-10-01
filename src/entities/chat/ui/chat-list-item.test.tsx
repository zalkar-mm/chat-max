import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChatListItem, type ChatListItemProps } from './chat-list-item'

const renderItem = (props: Partial<ChatListItemProps> = {}) => {
  const onOpen = vi.fn()
  render(
    <ChatListItem
      chatId="191234567"
      title="+7 999 123-45-67"
      preview="Вы: Привет"
      time="14:05"
      status={null}
      unreadCount={0}
      isSelected={false}
      onOpen={onOpen}
      {...props}
    />,
  )
  return { onOpen }
}

describe('ChatListItem', () => {
  it('показывает название, превью и время', () => {
    renderItem()
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument()
    expect(screen.getByText('Вы: Привет')).toBeInTheDocument()
    expect(screen.getByText('14:05')).toBeInTheDocument()
  })

  it('без сообщений показывает «Нет сообщений»', () => {
    renderItem({ preview: null, time: null })
    expect(screen.getByText('Нет сообщений')).toBeInTheDocument()
  })

  it('открывает чат по клику', async () => {
    const { onOpen } = renderItem()
    await userEvent.click(screen.getByRole('button', { name: /\+7 999 123-45-67/ }))
    expect(onOpen).toHaveBeenCalledWith('191234567')
  })

  it('открывает чат по Enter', async () => {
    const { onOpen } = renderItem()
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledWith('191234567')
  })

  it('ограничивает счётчик непрочитанных значением «99+» и прячет статус', () => {
    renderItem({ unreadCount: 150, status: 'failed' })
    expect(screen.getByText('99+')).toBeInTheDocument()
    expect(screen.queryByText('не отправлено')).not.toBeInTheDocument()
  })

  it('доступное имя: название, превью, время, статус', () => {
    renderItem({ status: 'failed' })
    expect(screen.getByRole('button')).toHaveAccessibleName(
      '+7 999 123-45-67, Вы: Привет, 14:05, не отправлено',
    )
  })

  it('помечает активный чат через aria-current', () => {
    renderItem({ isSelected: true })
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true')
  })

  it('с непрочитанными добавляет их число в доступное имя', () => {
    renderItem({ unreadCount: 12 })
    expect(screen.getByRole('button')).toHaveAccessibleName(
      '+7 999 123-45-67, Вы: Привет, 14:05, 12 непрочитанных',
    )
  })
})
