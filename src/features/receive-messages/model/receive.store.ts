import { create } from 'zustand'

export const ReceivePhase = {
  Idle: 'idle',
  Running: 'running',
  /** В настройках инстанса задан Webhook URL — HTTP API получения не работает. */
  WebhookConfigured: 'webhookConfigured',
  /** Инстанс отключён от MAX — ждём «Проверить снова». */
  InstanceDisconnected: 'instanceDisconnected',
} as const
export type ReceivePhase = (typeof ReceivePhase)[keyof typeof ReceivePhase]

/** Сколько сбоев сервера подряд, прежде чем сказать пользователю. */
export const FAILURES_BEFORE_BANNER = 3

type ReceiveState = {
  phase: ReceivePhase
  consecutiveFailures: number
  /** Когда будет следующая попытка после сбоя (ms epoch). */
  retryAt: number | null
  isIncomingDisabled: boolean
  isIncomingWarningDismissed: boolean
  isRechecking: boolean
}

export const INITIAL_RECEIVE_STATE: ReceiveState = {
  phase: ReceivePhase.Idle,
  consecutiveFailures: 0,
  retryAt: null,
  isIncomingDisabled: false,
  isIncomingWarningDismissed: false,
  isRechecking: false,
}

export const useReceiveStore = create<ReceiveState>()(() => INITIAL_RECEIVE_STATE)

export const setReceiveState = (patch: Partial<ReceiveState>) => {
  useReceiveStore.setState(patch)
}

export const resetReceiveState = () => {
  useReceiveStore.setState(INITIAL_RECEIVE_STATE, true)
}

export const useReceivePhase = () => useReceiveStore((state) => state.phase)

export const useServiceUnavailableRetryAt = () =>
  useReceiveStore((state) =>
    state.consecutiveFailures >= FAILURES_BEFORE_BANNER ? state.retryAt : null,
  )
