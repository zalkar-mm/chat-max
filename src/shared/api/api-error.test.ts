import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { ApiError, ApiErrorKind, isAbortError, toApiError } from './api-error'

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
    [404, ApiErrorKind.Unauthorized],
    [429, ApiErrorKind.RateLimited],
    [466, ApiErrorKind.QuotaExceeded],
    [469, ApiErrorKind.CheckLimit],
    [500, ApiErrorKind.Server],
    [502, ApiErrorKind.Server],
    [418, ApiErrorKind.Unknown],
  ])('HTTP %i → %s', (status, kind) => {
    expect(toApiError(httpError(status)).kind).toBe(kind)
  })

  it('HTTP-статус сохраняется в ошибке', () => {
    expect(toApiError(httpError(466)).status).toBe(466)
  })

  it.each(['ETIMEDOUT', 'ECONNABORTED'])('%s → timeout', (code) => {
    expect(toApiError(new AxiosError('timeout', code)).kind).toBe(ApiErrorKind.Timeout)
  })

  it('нет ответа, но браузер онлайн → server', () => {
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe(
      ApiErrorKind.Server,
    )
  })

  it('не axios-ошибка → unknown; готовая ApiError возвращается как есть', () => {
    expect(toApiError(new TypeError('boom')).kind).toBe(ApiErrorKind.Unknown)
    const error = new ApiError(ApiErrorKind.QuotaExceeded, 466)
    expect(toApiError(error)).toBe(error)
  })

  it('нет ответа и браузер офлайн → offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false)
    expect(toApiError(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe(
      ApiErrorKind.Offline,
    )
  })

  it('отмена запроса → aborted', () => {
    expect(toApiError(new CanceledError()).kind).toBe(ApiErrorKind.Aborted)
    expect(isAbortError(new CanceledError())).toBe(true)
    expect(isAbortError(httpError(500))).toBe(false)
  })

  it('сообщение ошибки не содержит URL запроса', () => {
    const error = new AxiosError('fail', 'ERR_NETWORK', {
      url: 'https://host/waInstance1/getStateInstance/secret',
      headers: new AxiosHeaders(),
    })
    expect(toApiError(error).message).not.toContain('secret')
  })
})
