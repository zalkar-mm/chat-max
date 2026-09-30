import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { ApiErrorKind } from '@/shared/api/api-error'

import { checkAccount } from './check-account'

import { server } from '@/mocks/node'

const credentials = {
  idInstance: '3100000001',
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
}

const CHECK_ACCOUNT_URL = '*/waInstance:id/checkAccount/:token'

describe('checkAccount', () => {
  it('возвращает chatId, если аккаунт найден', async () => {
    await expect(checkAccount(credentials, '79991234567')).resolves.toEqual({
      exists: true,
      chatId: '191234567',
    })
  })

  it('номер без MAX — exists: false', async () => {
    await expect(checkAccount(credentials, '79991230000')).resolves.toEqual({ exists: false })
  })

  it('пустой chatId трактует как «аккаунта нет»', async () => {
    server.use(http.post(CHECK_ACCOUNT_URL, () => HttpResponse.json({ exist: true, chatId: '' })))
    await expect(checkAccount(credentials, '79991234567')).resolves.toEqual({ exists: false })
  })

  it('469 превращает в ApiError checkLimit', async () => {
    await expect(checkAccount(credentials, '79991234690')).rejects.toMatchObject({
      kind: ApiErrorKind.CheckLimit,
    })
  })

  it('отправляет номер числом', async () => {
    let body: unknown = null
    server.use(
      http.post(CHECK_ACCOUNT_URL, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ exist: true, chatId: '123' })
      }),
    )
    await checkAccount(credentials, '375291234567')
    expect(body).toEqual({ phoneNumber: 375291234567 })
  })
})
