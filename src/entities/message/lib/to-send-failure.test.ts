import { describe, expect, it } from 'vitest'

import { ApiErrorKind } from '@/shared/api/api-error'

import { toSendFailure } from './to-send-failure'

describe('toSendFailure', () => {
  it.each([
    [ApiErrorKind.Offline, 'offline'],
    [ApiErrorKind.Forbidden, 'suspended'],
    [ApiErrorKind.QuotaExceeded, 'quotaExceeded'],
    [ApiErrorKind.BadRequest, 'rejected'],
  ] as const)('%s → %s', (kind, failure) => {
    expect(toSendFailure(kind)).toBe(failure)
  })

  it.each([
    ApiErrorKind.Timeout,
    ApiErrorKind.Server,
    ApiErrorKind.Unknown,
    ApiErrorKind.Unauthorized,
    ApiErrorKind.RateLimited,
    ApiErrorKind.CheckLimit,
    ApiErrorKind.Aborted,
  ])('остальные ошибки (%s) → failed', (kind) => {
    expect(toSendFailure(kind)).toBe('failed')
  })
})
