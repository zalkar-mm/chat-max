import { describe, expect, it } from 'vitest'

import { ApiErrorKind } from '@/shared/api/api-error'

import {
  isInvalidCredentialsError,
  SIGN_IN_ERROR_TEXT,
  type SignInErrorKind,
} from './sign-in-errors'

// Таблица ошибок входа (спринт 1, задача 2): неверные креды / 429 / 5xx / офлайн / таймаут.
const EXPECTED: [SignInErrorKind, string][] = [
  [ApiErrorKind.Unauthorized, 'Неверный idInstance или apiTokenInstance'],
  [ApiErrorKind.Forbidden, 'Неверный idInstance или apiTokenInstance'],
  [ApiErrorKind.BadRequest, 'Неверный idInstance или apiTokenInstance'],
  [ApiErrorKind.RateLimited, 'Слишком много запросов. Попробуйте через минуту'],
  [ApiErrorKind.Server, 'Сервис GREEN-API недоступен. Попробуйте позже'],
  [ApiErrorKind.Offline, 'Нет соединения с интернетом'],
  [ApiErrorKind.Timeout, 'Сервер не отвечает. Попробуйте ещё раз'],
  [ApiErrorKind.QuotaExceeded, 'Сервис GREEN-API недоступен. Попробуйте позже'],
  [ApiErrorKind.CheckLimit, 'Сервис GREEN-API недоступен. Попробуйте позже'],
  [ApiErrorKind.Unknown, 'Сервис GREEN-API недоступен. Попробуйте позже'],
]

describe('SIGN_IN_ERROR_TEXT', () => {
  it.each(EXPECTED)('%s → «%s»', (kind, text) => {
    expect(SIGN_IN_ERROR_TEXT[kind]).toBe(text)
  })

  it('у каждой ошибки входа есть текст', () => {
    expect(Object.keys(SIGN_IN_ERROR_TEXT).sort()).toEqual(EXPECTED.map(([kind]) => kind).sort())
  })
})

describe('isInvalidCredentialsError', () => {
  it.each([ApiErrorKind.Unauthorized, ApiErrorKind.Forbidden, ApiErrorKind.BadRequest])(
    '%s — неверные креды: сохранённую сессию забываем',
    (kind) => {
      expect(isInvalidCredentialsError(kind)).toBe(true)
    },
  )

  it.each([
    ApiErrorKind.RateLimited,
    ApiErrorKind.Server,
    ApiErrorKind.Offline,
    ApiErrorKind.Timeout,
    ApiErrorKind.Unknown,
  ])('%s — временный сбой: сессию не трогаем', (kind) => {
    expect(isInvalidCredentialsError(kind)).toBe(false)
  })
})
