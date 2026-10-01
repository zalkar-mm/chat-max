import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useSessionStore } from '@/entities/session/model/session.store'

import { abortSignInCheck, restoreSession } from './sign-in-flow'
import { initSignInFlow, useSignInFlowStore } from './sign-in-flow.store'

import { server } from '@/mocks/node'

describe('sign-in-flow', () => {
  it('результат отменённой проверки не применяется, даже если ответ уже пришёл', async () => {
    sessionStorage.setItem(
      'max-chat:session',
      JSON.stringify({ idInstance: '1', apiTokenInstance: 't', apiUrl: 'https://x' }),
    )
    initSignInFlow()
    let respond: () => void = () => undefined
    server.use(
      http.get('*/waInstance:id/getStateInstance/:token', async () => {
        await new Promise<void>((resolve) => {
          respond = resolve
        })
        return HttpResponse.json({ stateInstance: 'authorized' })
      }),
    )

    const pending = restoreSession()
    await new Promise((resolve) => setTimeout(resolve, 0))
    respond()
    abortSignInCheck()
    await pending

    expect(useSessionStore.getState().credentials).toBeNull()
    expect(useSignInFlowStore.getState().step.kind).toBe('restoring')
  })
})
