type StateScenario =
  | { kind: 'state'; delayMs: number; next: () => string }
  | { kind: 'status'; delayMs: number; status: number }

const constant = (state: string, delayMs = 500): StateScenario => ({
  kind: 'state',
  delayMs,
  next: () => state,
})

const startingThenAuthorized = (): StateScenario => {
  let calls = 0
  return {
    kind: 'state',
    delayMs: 400,
    next: () => {
      calls += 1
      return calls > 3 ? 'authorized' : 'starting'
    },
  }
}

// Последние две цифры idInstance выбирают сценарий. Таблица продублирована в src/mocks/README.md.
const SCENARIOS: Readonly<Record<string, () => StateScenario>> = {
  '01': () => constant('authorized'),
  '02': () => constant('suspended'),
  '03': () => constant('notAuthorized'),
  '04': startingThenAuthorized,
  '05': () => constant('blocked'),
  '06': () => constant('pendingPassword'),
  '07': () => constant('starting'),
  '29': () => ({ kind: 'status', delayMs: 300, status: 429 }),
  '50': () => ({ kind: 'status', delayMs: 300, status: 500 }),
  '99': () => constant('authorized', 20_000),
}

const cache = new Map<string, StateScenario>()

export function getStateScenario(idInstance: string): StateScenario {
  const cached = cache.get(idInstance)
  if (cached) return cached

  const create = SCENARIOS[idInstance.slice(-2)]
  const scenario = create ? create() : constant('authorized')
  cache.set(idInstance, scenario)
  return scenario
}

export function resetScenarios() {
  cache.clear()
}

type HttpScenario<T> = ({ kind: 'ok' } & T) | { kind: 'status'; status: number }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

// Окончание номера выбирает ответ checkAccount. Таблица — в src/mocks/README.md.
const CHECK_ACCOUNT_STATUS: Readonly<Record<string, number>> = {
  '4000': 400,
  '4030': 403,
  '4660': 466,
  '4690': 469,
  '5000': 500,
}

export function getCheckAccountScenario(
  body: unknown,
): HttpScenario<{ exist: boolean; chatId: string }> {
  const phone = isRecord(body) ? String(body.phoneNumber) : ''
  const status = CHECK_ACCOUNT_STATUS[phone.slice(-4)]
  if (status !== undefined) return { kind: 'status', status }
  if (phone.endsWith('0000')) return { kind: 'ok', exist: false, chatId: '' }
  return { kind: 'ok', exist: true, chatId: `1${phone.slice(-8)}` }
}

// Метка в тексте сообщения выбирает ответ sendMessage: «привет #466».
const SEND_MESSAGE_STATUS: Readonly<Record<string, number>> = {
  '#400': 400,
  '#403': 403,
  '#466': 466,
  '#500': 500,
}

let messageCounter = 0

export function getSendMessageScenario(body: unknown): HttpScenario<{ idMessage: string }> {
  const text = isRecord(body) ? String(body.message) : ''
  const tag = Object.keys(SEND_MESSAGE_STATUS).find((key) => text.includes(key))
  const status = tag === undefined ? undefined : SEND_MESSAGE_STATUS[tag]
  if (status !== undefined) return { kind: 'status', status }
  messageCounter += 1
  return { kind: 'ok', idMessage: `mock-${Date.now()}-${messageCounter}` }
}
