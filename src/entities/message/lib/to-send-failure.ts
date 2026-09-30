import type { ApiErrorKind } from '@/shared/api/api-error'

import type { SendFailure } from '../model/message.types'

const FAILURE_BY_KIND: Readonly<Record<ApiErrorKind, SendFailure>> = {
  offline: 'offline',
  forbidden: 'suspended',
  quotaExceeded: 'quotaExceeded',
  badRequest: 'rejected',
  timeout: 'failed',
  server: 'failed',
  unknown: 'failed',
  unauthorized: 'failed',
  rateLimited: 'failed',
  checkLimit: 'failed',
  aborted: 'failed',
}

export function toSendFailure(kind: ApiErrorKind): SendFailure {
  return FAILURE_BY_KIND[kind]
}
