import { describe, expect, it } from 'vitest'

import { createChatSchema, PHONE_FORMAT_ERROR } from './create-chat.schema'

const errorOf = (phone: string) => {
  const result = createChatSchema.safeParse({ phone })
  return result.success ? null : result.error.issues[0]?.message
}

describe('createChatSchema — проверка номера', () => {
  it.each(['', '   '])('пусто («%s») → «Введите номер телефона»', (phone) => {
    expect(errorOf(phone)).toBe('Введите номер телефона')
  })

  it.each(['+996 555 123 456', '+7 999 123', '+375 29 123-45-6', 'не номер'])(
    '«%s» → ошибка формата',
    (phone) => {
      expect(errorOf(phone)).toBe(PHONE_FORMAT_ERROR)
    },
  )

  it.each(['+7 (999) 123-45-67', '8 999 123 45 67', '+375 29 123-45-67'])(
    '«%s» — допустимый номер',
    (phone) => {
      expect(errorOf(phone)).toBeNull()
    },
  )
})
