import { InstanceState } from '@/entities/session/model/instance-state'

import { isAbortError } from '@/shared/api/api-error'

export const STARTING_RECHECK_INTERVAL_MS = 10_000
export const STARTING_MAX_ATTEMPTS = 30

type StartingPollerOptions = {
  check: (signal: AbortSignal) => Promise<InstanceState>
  onAttempt: (attempt: number) => void
  onResolved: (state: InstanceState) => void
  onGiveUp: () => void
  /** Ошибка, после которой ждать бессмысленно (например, неверные креды): опрос останавливается. */
  isFatalError?: (error: unknown) => boolean
  onFatalError?: (error: unknown) => void
  intervalMs?: number
  maxAttempts?: number
}

export type StartingPoller = {
  start: () => void
  stop: () => void
}

/**
 * Автоперепроверка инстанса в статусе `starting`: раз в `intervalMs`, не больше `maxAttempts` раз.
 * Ошибка сети засчитывается как неудачная попытка — инстанс может ещё подняться.
 */
export function createStartingPoller({
  check,
  onAttempt,
  onResolved,
  onGiveUp,
  isFatalError = () => false,
  onFatalError = () => undefined,
  intervalMs = STARTING_RECHECK_INTERVAL_MS,
  maxAttempts = STARTING_MAX_ATTEMPTS,
}: StartingPollerOptions): StartingPoller {
  let isRunning = false
  let attempt = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let controller: AbortController | null = null

  const stop = () => {
    isRunning = false
    if (timer !== null) clearTimeout(timer)
    timer = null
    controller?.abort()
    controller = null
  }

  const checkOnce = async (signal: AbortSignal): Promise<InstanceState | null> => {
    try {
      return await check(signal)
    } catch (error) {
      if (isAbortError(error)) return null
      if (isFatalError(error)) {
        stop()
        onFatalError(error)
        return null
      }
      return InstanceState.Starting
    }
  }

  const run = async () => {
    attempt += 1
    onAttempt(attempt)
    controller = new AbortController()
    const state = await checkOnce(controller.signal)
    if (!isRunning || state === null) return

    if (state !== InstanceState.Starting) {
      stop()
      onResolved(state)
      return
    }
    if (attempt >= maxAttempts) {
      stop()
      onGiveUp()
      return
    }
    schedule()
  }

  const schedule = () => {
    timer = setTimeout(() => void run(), intervalMs)
  }

  const start = () => {
    if (isRunning) return
    isRunning = true
    attempt = 0
    schedule()
  }

  return { start, stop }
}
