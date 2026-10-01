import { delay, http, HttpResponse } from 'msw'

import { simulateRecipient } from './dev-replies'
import { deleteQueued, takeNotification } from './notification-queue'
import {
  getCheckAccountScenario,
  getSendMessageScenario,
  getSettingsScenario,
  getStateScenario,
  isReceiveBroken,
} from './scenarios'

// В тестах задержки не нужны: время двигают фейковые таймеры.
const withLatency = (ms: number) => delay(import.meta.env.MODE === 'test' ? 0 : ms)

const METHOD_URL = (method: string) => `*/waInstance:idInstance/${method}/:apiTokenInstance`

const unauthorized = () => new HttpResponse(null, { status: 401 })

const isTest = import.meta.env.MODE === 'test'
// В тестах long-poll короче: события кладутся явно, а пустой ответ не должен держать тест.
const longPollMs = (receiveTimeoutS: number) => (isTest ? 200 : receiveTimeoutS * 1000)

export const handlers = [
  http.get(METHOD_URL('getStateInstance'), async ({ params }) => {
    const scenario = getStateScenario(String(params.idInstance))
    await withLatency(scenario.delayMs)

    if (params.apiTokenInstance === 'wrong') return unauthorized()
    if (scenario.kind === 'status') return new HttpResponse(null, { status: scenario.status })
    return HttpResponse.json({ stateInstance: scenario.next() })
  }),

  http.post(METHOD_URL('checkAccount'), async ({ params, request }) => {
    await withLatency(700)
    if (params.apiTokenInstance === 'wrong') return unauthorized()

    const body: unknown = await request.json()
    const scenario = getCheckAccountScenario(body)
    if (scenario.kind === 'status') return new HttpResponse(null, { status: scenario.status })
    return HttpResponse.json({ exist: scenario.exist, chatId: scenario.chatId, fromCache: false })
  }),

  http.post(METHOD_URL('sendMessage'), async ({ params, request }) => {
    await withLatency(600)
    if (params.apiTokenInstance === 'wrong') return unauthorized()

    const body: unknown = await request.json()
    const scenario = getSendMessageScenario(body)
    if (scenario.kind === 'status') return new HttpResponse(null, { status: scenario.status })
    if (!isTest) {
      simulateRecipient(
        String(params.idInstance),
        scenario.chatId,
        scenario.idMessage,
        scenario.text,
      )
    }
    return HttpResponse.json({ idMessage: scenario.idMessage })
  }),

  http.get(METHOD_URL('getSettings'), async ({ params }) => {
    await withLatency(300)
    if (params.apiTokenInstance === 'wrong') return unauthorized()
    return HttpResponse.json(getSettingsScenario(String(params.idInstance)))
  }),

  http.get(METHOD_URL('receiveNotification'), async ({ params, request }) => {
    if (params.apiTokenInstance === 'wrong') return unauthorized()
    const idInstance = String(params.idInstance)
    if (isReceiveBroken(idInstance)) {
      await withLatency(300)
      return new HttpResponse(null, { status: 500 })
    }
    const timeoutS = Number(new URL(request.url).searchParams.get('receiveTimeout') ?? 5)
    const item = await takeNotification(idInstance, longPollMs(timeoutS), request.signal)
    return HttpResponse.json(item)
  }),

  http.delete(
    `*/waInstance:idInstance/deleteNotification/:apiTokenInstance/:receiptId`,
    async ({ params }) => {
      await withLatency(100)
      const isDeleted = deleteQueued(String(params.idInstance), Number(params.receiptId))
      return HttpResponse.json({ result: isDeleted, reason: '' })
    },
  ),
]
