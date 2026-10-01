import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ChatHeader } from './chat-header'

const onBack = vi.fn()

describe('ChatHeader', () => {
  it('с именем показывает имя и номер под ним', () => {
    render(
      <ChatHeader
        chatId="191234567"
        title="Анна"
        name="Анна"
        phone="79991234567"
        onBack={onBack}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Анна' })).toBeInTheDocument()
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument()
  })

  it('без имени — одна строка с названием-номером', () => {
    render(
      <ChatHeader
        chatId="191234567"
        title="+7 999 123-45-67"
        name={null}
        phone="79991234567"
        onBack={onBack}
      />,
    )
    expect(screen.getByRole('heading', { name: '+7 999 123-45-67' })).toBeInTheDocument()
    expect(screen.getAllByText('+7 999 123-45-67')).toHaveLength(1)
  })
})
