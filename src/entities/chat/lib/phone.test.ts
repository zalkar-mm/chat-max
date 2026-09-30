import { describe, expect, it } from 'vitest'

import { formatPhone, isSupportedPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['8 999 123 45 67', '79991234567'],
    ['+375 29 123-45-67', '375291234567'],
    ['+996 555 123 456', '996555123456'],
  ])('%s → %s', (raw, digits) => {
    expect(normalizePhone(raw)).toBe(digits)
  })

  it('не трогает 8 в начале, если цифр не 11', () => {
    expect(normalizePhone('8 999 123')).toBe('8999123')
  })
})

describe('isSupportedPhone', () => {
  it.each(['+7 (999) 123-45-67', '8 999 123 45 67', '+375 29 123-45-67'])('принимает %s', (raw) => {
    expect(isSupportedPhone(normalizePhone(raw))).toBe(true)
  })

  it.each(['+996 555 123 456', '+7 999 123', '', '+375 29 123-45-6'])('отклоняет «%s»', (raw) => {
    expect(isSupportedPhone(normalizePhone(raw))).toBe(false)
  })
})

describe('formatPhone', () => {
  it('форматирует российский номер', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })

  it('форматирует белорусский номер', () => {
    expect(formatPhone('375291234567')).toBe('+375 29 123-45-67')
  })

  it('прочие номера показывает с плюсом без разбивки', () => {
    expect(formatPhone('996555123456')).toBe('+996555123456')
  })
})
