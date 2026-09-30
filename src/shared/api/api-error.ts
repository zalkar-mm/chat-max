import { isAxiosError, isCancel } from 'axios'

export const ApiErrorKind = {
  Offline: 'offline',
  Timeout: 'timeout',
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  BadRequest: 'badRequest',
  QuotaExceeded: 'quotaExceeded',
  CheckLimit: 'checkLimit',
  RateLimited: 'rateLimited',
  Server: 'server',
  Aborted: 'aborted',
  Unknown: 'unknown',
} as const
export type ApiErrorKind = (typeof ApiErrorKind)[keyof typeof ApiErrorKind]

/** Ошибка обращения к GREEN-API. Текста для пользователя не содержит: его выбирает фича по `kind`. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null

  constructor(kind: ApiErrorKind, status: number | null = null) {
    super(`GREEN-API request failed: ${kind}`)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

const STATUS_KIND: Readonly<Record<number, ApiErrorKind>> = {
  400: ApiErrorKind.BadRequest,
  401: ApiErrorKind.Unauthorized,
  403: ApiErrorKind.Forbidden,
  404: ApiErrorKind.Unauthorized,
  429: ApiErrorKind.RateLimited,
  466: ApiErrorKind.QuotaExceeded,
  469: ApiErrorKind.CheckLimit,
}

function kindByStatus(status: number): ApiErrorKind {
  if (status >= 500) return ApiErrorKind.Server
  return STATUS_KIND[status] ?? ApiErrorKind.Unknown
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isCancel(error)) return new ApiError(ApiErrorKind.Aborted)
  if (!isAxiosError(error)) return new ApiError(ApiErrorKind.Unknown)

  if (error.response)
    return new ApiError(kindByStatus(error.response.status), error.response.status)
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
    return new ApiError(ApiErrorKind.Timeout)
  return new ApiError(navigator.onLine ? ApiErrorKind.Server : ApiErrorKind.Offline)
}

export const isAbortError = (error: unknown) => toApiError(error).kind === ApiErrorKind.Aborted
