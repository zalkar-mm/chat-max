import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChatAvatar } from './chat-avatar'

describe('ChatAvatar', () => {
  it('с именем показывает заглавный инициал вместо иконки', () => {
    const { container } = render(<ChatAvatar chatId="191234567" size={36} name="анна" />)
    expect(container).toHaveTextContent('А')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('без имени показывает иконку пользователя', () => {
    const { container } = render(<ChatAvatar chatId="191234567" size={48} name={null} />)
    expect(container).toHaveTextContent('')
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
