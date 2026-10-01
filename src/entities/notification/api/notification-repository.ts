import { buildMethodUrl } from '@/shared/api/build-method-url'
import type { Credentials } from '@/shared/api/credentials'
import { greenApiClient } from '@/shared/api/green-api-client'
import { parseResponse } from '@/shared/api/parse-response'

import {
  deleteNotificationResponseSchema,
  receiveNotificationResponseSchema,
} from './notification-dto'

/** Сколько сервер держит long-poll запрос, если событий нет (допустимо 5–60 с). */
export const RECEIVE_TIMEOUT_S = 20

// Клиентский таймаут больше серверного ожидания: пустой ответ приходит через RECEIVE_TIMEOUT_S.
const RECEIVE_CLIENT_TIMEOUT_MS = (RECEIVE_TIMEOUT_S + 10) * 1000

export const notificationRepository = {
  receive: (credentials: Credentials, signal: AbortSignal) =>
    greenApiClient
      .get<unknown>(buildMethodUrl(credentials, 'receiveNotification'), {
        params: { receiveTimeout: RECEIVE_TIMEOUT_S },
        timeout: RECEIVE_CLIENT_TIMEOUT_MS,
        signal,
      })
      .then((response) => parseResponse(receiveNotificationResponseSchema, response.data)),

  /** false — событие уже удалено раньше: для цикла это не ошибка. */
  remove: (credentials: Credentials, receiptId: number, signal: AbortSignal) =>
    greenApiClient
      .delete<unknown>(buildMethodUrl(credentials, 'deleteNotification', String(receiptId)), {
        signal,
      })
      .then((response) => parseResponse(deleteNotificationResponseSchema, response.data).result),
}
