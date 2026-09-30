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

  const create = SCENARIOS[idInstance.slice(-2)] ?? SCENARIOS['01']
  const scenario = create ? create() : constant('authorized')
  cache.set(idInstance, scenario)
  return scenario
}

export function resetScenarios() {
  cache.clear()
}
