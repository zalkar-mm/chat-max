import { type ApiErrorKind } from '@/shared/api/api-error'

import { PHONE_FORMAT_ERROR } from './create-chat.schema'

export type CreateChatFailure =
  | 'format'
  | 'notFound'
  | 'instanceNotReady'
  | 'checkLimit'
  | 'quotaExceeded'
  | 'offline'
  | 'unavailable'

/** Текст ошибки; `consoleLink` — фрагмент-ссылка на личный кабинет GREEN-API и хвост после неё. */
export type FailureText = {
  text: string
  consoleLink: { label: string; after: string } | null
}

const CONSOLE_LINK_LABEL = 'личном кабинете'

export const CREATE_CHAT_FAILURE_TEXT: Readonly<Record<CreateChatFailure, FailureText>> = {
  format: { text: PHONE_FORMAT_ERROR, consoleLink: null },
  notFound: { text: 'Этот номер не зарегистрирован в MAX', consoleLink: null },
  instanceNotReady: {
    text: 'Инстанс не подключён к MAX. Проверьте его в ',
    consoleLink: { label: CONSOLE_LINK_LABEL, after: '' },
  },
  checkLimit: {
    text: 'Слишком много проверок номеров. Попробуйте через 2 часа',
    consoleLink: null,
  },
  quotaExceeded: {
    text: 'Лимит бесплатного тарифа исчерпан. Смените тариф в ',
    consoleLink: { label: CONSOLE_LINK_LABEL, after: ' GREEN-API' },
  },
  offline: { text: 'Нет соединения с интернетом', consoleLink: null },
  unavailable: { text: 'Сервис GREEN-API недоступен. Попробуйте позже', consoleLink: null },
}

const FAILURE_BY_API_ERROR: Readonly<Record<ApiErrorKind, CreateChatFailure | null>> = {
  badRequest: 'format',
  forbidden: 'instanceNotReady',
  unauthorized: 'instanceNotReady',
  checkLimit: 'checkLimit',
  quotaExceeded: 'quotaExceeded',
  offline: 'offline',
  timeout: 'unavailable',
  server: 'unavailable',
  rateLimited: 'unavailable',
  unknown: 'unavailable',
  aborted: null,
}

export const toCreateChatFailure = (kind: ApiErrorKind) => FAILURE_BY_API_ERROR[kind]
