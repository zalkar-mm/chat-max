import { delay, http, HttpResponse } from 'msw'

import { getCheckAccountScenario, getSendMessageScenario, getStateScenario } from './scenarios'

// В тестах задержки не нужны: время двигают фейковые таймеры.
const withLatency = (ms: number) => delay(import.meta.env.MODE === 'test' ? 0 : ms)

const METHOD_URL = (method: string) => `*/waInstance:idInstance/${method}/:apiTokenInstance`

const unauthorized = () => new HttpResponse(null, { status: 401 })

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
    return HttpResponse.json({ idMessage: scenario.idMessage })
  }),
]
