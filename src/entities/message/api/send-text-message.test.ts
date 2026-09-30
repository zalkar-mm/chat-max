import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { ApiError, ApiErrorKind } from '@/shared/api/api-error'

import { sendTextMessage } from './send-text-message'

import { server } from '@/mocks/node'

const credentials = {
  idInstance: '3100000001',
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
}

describe('sendTextMessage', () => {
  it('отправляет chatId и текст и возвращает idMessage', async () => {
    let body: unknown = null
    server.use(
      http.post('*/waInstance:id/sendMessage/:token', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ idMessage: 'BAE5F4886' })
      }),
    )

    await expect(sendTextMessage(credentials, '79991234567@c.us', 'привет')).resolves.toBe(
      'BAE5F4886',
    )
    expect(body).toEqual({ chatId: '79991234567@c.us', message: 'привет' })
  })

  it('с моком по умолчанию возвращает строковый idMessage', async () => {
    await expect(sendTextMessage(credentials, '79991234567@c.us', 'привет')).resolves.toEqual(
      expect.any(String),
    )
  })

  it('HTTP 466 → ApiError quotaExceeded', async () => {
    const error = await sendTextMessage(credentials, '79991234567@c.us', 'лимит #466').catch(
      (reason: unknown) => reason,
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: ApiErrorKind.QuotaExceeded })
  })

  it('ответ не по схеме → ApiError unknown', async () => {
    server.use(http.post('*/waInstance:id/sendMessage/:token', () => HttpResponse.json({})))
    await expect(sendTextMessage(credentials, '79991234567@c.us', 'привет')).rejects.toMatchObject({
      kind: ApiErrorKind.Unknown,
    })
  })
})
