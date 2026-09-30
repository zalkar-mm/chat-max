import { ApiErrorKind } from '@/shared/api/api-error'

export type SignInErrorKind = Exclude<ApiErrorKind, typeof ApiErrorKind.Aborted>

const INVALID_CREDENTIALS = 'Неверный idInstance или apiTokenInstance'
const SERVICE_UNAVAILABLE = 'Сервис GREEN-API недоступен. Попробуйте позже'

export const SIGN_IN_ERROR_TEXT: Readonly<Record<SignInErrorKind, string>> = {
  unauthorized: INVALID_CREDENTIALS,
  forbidden: INVALID_CREDENTIALS,
  badRequest: INVALID_CREDENTIALS,
  rateLimited: 'Слишком много запросов. Попробуйте через минуту',
  offline: 'Нет соединения с интернетом',
  timeout: 'Сервер не отвечает. Попробуйте ещё раз',
  server: SERVICE_UNAVAILABLE,
  quotaExceeded: SERVICE_UNAVAILABLE,
  checkLimit: SERVICE_UNAVAILABLE,
  unknown: SERVICE_UNAVAILABLE,
}

/** Эти ошибки означают неверные креды: сохранённую сессию с ними надо забыть. */
export const isInvalidCredentialsError = (kind: SignInErrorKind) =>
  kind === ApiErrorKind.Unauthorized ||
  kind === ApiErrorKind.Forbidden ||
  kind === ApiErrorKind.BadRequest
