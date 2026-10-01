import { describe, expect, it } from 'vitest'

import { ApiErrorKind } from '@/shared/api/api-error'

import {
  CREATE_CHAT_FAILURE_TEXT,
  type CreateChatFailure,
  toCreateChatFailure,
} from './create-chat-errors'

/** Текст целиком, как его видит пользователь: ссылка на личный кабинет — часть фразы. */
const fullText = (failure: CreateChatFailure) => {
  const { text, consoleLink } = CREATE_CHAT_FAILURE_TEXT[failure]
  return consoleLink === null ? text : `${text}${consoleLink.label}${consoleLink.after}`
}

describe('toCreateChatFailure', () => {
  it.each([
    [ApiErrorKind.BadRequest, 'format'],
    [ApiErrorKind.Forbidden, 'instanceNotReady'],
    [ApiErrorKind.Unauthorized, 'instanceNotReady'],
    [ApiErrorKind.CheckLimit, 'checkLimit'],
    [ApiErrorKind.QuotaExceeded, 'quotaExceeded'],
    [ApiErrorKind.Offline, 'offline'],
    [ApiErrorKind.Timeout, 'unavailable'],
    [ApiErrorKind.Server, 'unavailable'],
    [ApiErrorKind.RateLimited, 'unavailable'],
    [ApiErrorKind.Unknown, 'unavailable'],
  ] as const)('%s → %s', (kind, failure) => {
    expect(toCreateChatFailure(kind)).toBe(failure)
  })

  it('отмена запроса — не ошибка для пользователя', () => {
    expect(toCreateChatFailure(ApiErrorKind.Aborted)).toBeNull()
  })
})

// Таблица результатов checkAccount.
describe('CREATE_CHAT_FAILURE_TEXT', () => {
  it.each([
    ['notFound', 'Этот номер не зарегистрирован в MAX'],
    ['instanceNotReady', 'Инстанс не подключён к MAX. Проверьте его в личном кабинете'],
    ['checkLimit', 'Слишком много проверок номеров. Попробуйте через 2 часа'],
    [
      'quotaExceeded',
      'Лимит бесплатного тарифа исчерпан. Смените тариф в личном кабинете GREEN-API',
    ],
    ['format', 'Номер должен быть российским (+7, 11 цифр) или белорусским (+375, 12 цифр)'],
    ['offline', 'Нет соединения с интернетом'],
    ['unavailable', 'Сервис GREEN-API недоступен. Попробуйте позже'],
  ] as const)('%s → «%s»', (failure, text) => {
    expect(fullText(failure)).toBe(text)
  })
})
