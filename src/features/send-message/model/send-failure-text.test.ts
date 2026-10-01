import { describe, expect, it } from 'vitest'

import { toSendFailure } from '@/entities/message/lib/to-send-failure'

import { ApiErrorKind } from '@/shared/api/api-error'

import { SEND_FAILURE_TEXT } from './send-failure-text'

const textFor = (kind: ApiErrorKind) => SEND_FAILURE_TEXT[toSendFailure(kind)]

// Таблица «Ошибки → текст под пузырём»: ответ API → текст и «Повторить».
describe('ошибка отправки → текст под пузырём', () => {
  it.each([
    [ApiErrorKind.Offline, 'Нет соединения.', true],
    [
      ApiErrorKind.Forbidden,
      'Не отправлено: аккаунт ограничен, можно писать только контактам.',
      true,
    ],
    [ApiErrorKind.QuotaExceeded, 'Не отправлено: исчерпан лимит бесплатного тарифа', false],
    [ApiErrorKind.BadRequest, 'Не отправлено: сервер отклонил сообщение.', true],
    [ApiErrorKind.Server, 'Не отправлено.', true],
    [ApiErrorKind.Timeout, 'Не отправлено.', true],
  ])('%s → «%s», «Повторить»: %s', (kind, text, canRetry) => {
    expect(textFor(kind)).toEqual({ text, canRetry })
  })

  it('статус «не доставлено» из очереди → «Не доставлено.» с «Повторить»', () => {
    expect(SEND_FAILURE_TEXT.undelivered).toEqual({ text: 'Не доставлено.', canRetry: true })
  })
})
