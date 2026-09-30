import { delay, http, HttpResponse } from 'msw'

import { getStateScenario } from './scenarios'

// В тестах задержки не нужны: время двигают фейковые таймеры.
const withLatency = (ms: number) => delay(import.meta.env.MODE === 'test' ? 0 : ms)

const METHOD_URL = (method: string) => `*/waInstance:idInstance/${method}/:apiTokenInstance`

export const handlers = [
  http.get(METHOD_URL('getStateInstance'), async ({ params }) => {
    const idInstance = String(params.idInstance)
    const scenario = getStateScenario(idInstance)
    await withLatency(scenario.delayMs)

    if (params.apiTokenInstance === 'wrong') return new HttpResponse(null, { status: 401 })
    if (scenario.kind === 'status') return new HttpResponse(null, { status: scenario.status })
    return HttpResponse.json({ stateInstance: scenario.next() })
  }),
]
