import { describe, expect, it } from 'vitest'

import { pluralize } from './plural'

const FORMS = ['новое сообщение', 'новых сообщения', 'новых сообщений'] as const

describe('pluralize', () => {
  it.each([
    [1, 'новое сообщение'],
    [2, 'новых сообщения'],
    [5, 'новых сообщений'],
    [11, 'новых сообщений'],
    [21, 'новое сообщение'],
    [22, 'новых сообщения'],
    [112, 'новых сообщений'],
  ])('%i → %s', (count, form) => {
    expect(pluralize(count, FORMS)).toBe(form)
  })
})
