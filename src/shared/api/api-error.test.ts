import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { ApiErrorKind, toApiError } from './api-error'

const httpError = (status: number) =>
  new AxiosError('fail', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config: { headers: new AxiosHeaders() },
  })

describe('toApiError', () => {
  it.each([
    [400, ApiErrorKind.BadRequest],
    [401, ApiErrorKind.Unauthorized],
    [403, ApiErrorKind.Forbidden],
    [429, ApiErrorKind.RateLimited],
    [466, ApiErrorKind.QuotaExceeded],
    [469, ApiErrorKind.CheckLimit],
    [502, ApiErrorKind.Server],
  ])('HTTP %i → %s', (status, kind) => {
    expect(toApiError(httpError(status)).kind).toBe(kind)
  })

  it('ETIMEDOUT → timeout', () => {
    expect(toApiError(new AxiosError('timeout', 'ETIMEDOUT')).kind).toBe(ApiErrorKind.Timeout)
  })

  it('нет ответа и браузер офлайн → offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false)
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe(
      ApiErrorKind.Offline,
    )
  })

  it('отмена запроса → aborted', () => {
    expect(toApiError(new CanceledError()).kind).toBe(ApiErrorKind.Aborted)
  })

  it('сообщение ошибки не содержит URL запроса', () => {
    const error = new AxiosError('fail', 'ERR_NETWORK', {
      url: 'https://host/waInstance1/getStateInstance/secret',
      headers: new AxiosHeaders(),
    })
    expect(toApiError(error).message).not.toContain('secret')
  })
})
