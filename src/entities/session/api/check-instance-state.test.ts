import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { ApiError, ApiErrorKind } from '@/shared/api/api-error'

import { InstanceState } from '../model/instance-state'

import { checkInstanceState } from './check-instance-state'

import { server } from '@/mocks/node'

const credentials = {
  idInstance: '3100000001',
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
}

const respondWith = (response: Response) => {
  server.use(http.get('*/waInstance:id/getStateInstance/:token', () => response))
}

describe('checkInstanceState', () => {
  it('возвращает статус инстанса', async () => {
    await expect(checkInstanceState(credentials)).resolves.toBe(InstanceState.Authorized)
  })

  it('незнакомый статус трактует как notAuthorized', async () => {
    respondWith(HttpResponse.json({ stateInstance: 'somethingNew' }))
    await expect(checkInstanceState(credentials)).resolves.toBe(InstanceState.NotAuthorized)
  })

  it('401 превращает в ApiError unauthorized', async () => {
    respondWith(new HttpResponse(null, { status: 401 }))
    await expect(checkInstanceState(credentials)).rejects.toMatchObject({
      kind: ApiErrorKind.Unauthorized,
    })
  })

  it('ответ не по схеме — ApiError unknown', async () => {
    respondWith(HttpResponse.json({ foo: 1 }))
    const error = await checkInstanceState(credentials).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: ApiErrorKind.Unknown })
  })

  it('обращается к методу по URL инстанса', async () => {
    let requestedUrl = ''
    server.use(
      http.get('*/waInstance:id/getStateInstance/:token', ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json({ stateInstance: 'authorized' })
      }),
    )
    await checkInstanceState({ ...credentials, apiUrl: 'https://3100.api.green-api.com/' })
    expect(requestedUrl).toBe(
      'https://3100.api.green-api.com/waInstance3100000001/getStateInstance/token',
    )
  })
})
