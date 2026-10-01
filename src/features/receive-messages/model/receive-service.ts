import {
  deleteNotification,
  receiveNotification,
} from '@/entities/notification/api/notification-queue'
import { checkInstanceState } from '@/entities/session/api/check-instance-state'
import { getInstanceSettings } from '@/entities/session/api/get-instance-settings'
import { isUsableInstanceState } from '@/entities/session/model/instance-state'
import {
  getSessionCredentials,
  subscribeToSessionChange,
  useSessionStore,
} from '@/entities/session/model/session.store'

import { ApiErrorKind } from '@/shared/api/api-error'
import type { Credentials } from '@/shared/api/credentials'

import { applyNotification, resetPendingEchoes } from './apply-notification'
import { createNotificationPoller } from './create-notification-poller'
import { parseNotification } from './parse-notification'
import { ReceivePhase, resetReceiveState, setReceiveState, useReceiveStore } from './receive.store'

const requireCredentials = (): Credentials => {
  const credentials = getSessionCredentials()
  if (!credentials) throw new Error('Получение сообщений без сессии')
  return credentials
}

const poller = createNotificationPoller({
  receive: (signal) => receiveNotification(requireCredentials(), signal),
  remove: (receiptId, signal) => deleteNotification(requireCredentials(), receiptId, signal),
  handle: (notification) => {
    applyNotification(parseNotification(notification.body))
  },
  onFailure: ({ retryInMs, kind }) => {
    // «Сервис недоступен» — только про сбои сервера подряд: офлайн показывает свой баннер и сбрасывает серию,
    // лимит тарифа — свой баннер.
    if (kind === ApiErrorKind.Offline) {
      setReceiveState({ consecutiveFailures: 0, retryAt: null })
      return
    }
    if (kind === ApiErrorKind.QuotaExceeded) return
    const { consecutiveFailures } = useReceiveStore.getState()
    setReceiveState({
      consecutiveFailures: consecutiveFailures + 1,
      retryAt: Date.now() + retryInMs,
    })
  },
  onQuotaExceeded: () => {
    useSessionStore.getState().markQuotaExceeded()
  },
  onRecovered: () => {
    setReceiveState({ consecutiveFailures: 0, retryAt: null })
  },
  onUnauthorized: () => {
    useSessionStore.getState().endSession('expired')
  },
  onHandleError: (error) => {
    if (import.meta.env.DEV) console.error('Не удалось обработать событие очереди', error)
  },
})

let activation: AbortController | null = null

/** Пока инстанс отключён, очередь не опрашивается — его статус проверяем сами, раз в столько. */
export const DISCONNECTED_RECHECK_MS = 15_000
let disconnectedTimer: ReturnType<typeof setInterval> | null = null

function stopDisconnectedRecheck() {
  if (disconnectedTimer !== null) clearInterval(disconnectedTimer)
  disconnectedTimer = null
}

/** Отключённый инстанс: цикл на паузе, статус проверяется по таймеру — вернулся authorized, баннер уходит сам. */
function enterDisconnected() {
  poller.pause()
  setReceiveState({
    phase: ReceivePhase.InstanceDisconnected,
    consecutiveFailures: 0,
    retryAt: null,
  })
  if (disconnectedTimer !== null) return
  disconnectedTimer = setInterval(() => {
    const credentials = getSessionCredentials()
    if (!credentials) return
    checkInstanceState(credentials)
      .then((state) => {
        useSessionStore.getState().setInstanceState(state)
      })
      .catch(() => undefined)
  }, DISCONNECTED_RECHECK_MS)
}

/**
 * Запуск получения для текущей сессии: Webhook URL в настройках — не запускаем,
 * инстанс не готов — пауза с периодической проверкой статуса.
 */
async function activate() {
  const credentials = getSessionCredentials()
  if (!credentials) return
  activation?.abort()
  const controller = new AbortController()
  activation = controller

  try {
    const settings = await getInstanceSettings(credentials, controller.signal)
    if (controller.signal.aborted) return
    setReceiveState({ isIncomingDisabled: settings.isIncomingDisabled })
    if (settings.hasWebhookUrl) {
      poller.pause()
      setReceiveState({
        phase: ReceivePhase.WebhookConfigured,
        consecutiveFailures: 0,
        retryAt: null,
      })
      return
    }
  } catch {
    // Настройки не прочитались — не повод не получать сообщения: цикл сам покажет сбои сервера.
    if (controller.signal.aborted) return
  }

  const state = useSessionStore.getState().instanceState
  if (state !== null && !isUsableInstanceState(state)) {
    enterDisconnected()
    return
  }
  stopDisconnectedRecheck()
  setReceiveState({ phase: ReceivePhase.Running })
  poller.start()
}

function deactivate() {
  stopDisconnectedRecheck()
  activation?.abort()
  activation = null
  poller.stop()
  resetPendingEchoes()
  resetReceiveState()
}

/** «Проверить снова»: статус инстанса и настройки, затем возобновление цикла. */
export async function recheckReceiving() {
  const credentials = getSessionCredentials()
  if (!credentials || useReceiveStore.getState().isRechecking) return
  setReceiveState({ isRechecking: true })
  try {
    const state = await checkInstanceState(credentials)
    useSessionStore.getState().setInstanceState(state)
    await activate()
  } catch {
    // Ошибку сети покажет баннер офлайна или «сервис недоступен» цикла.
  } finally {
    setReceiveState({ isRechecking: false })
  }
}

export function dismissIncomingWarning() {
  setReceiveState({ isIncomingWarningDismissed: true })
}

let stopReceiving: (() => void) | null = null

/** Запускается из app (идемпотентно): цикл живёт ровно столько, сколько сессия. */
export function startReceiving() {
  if (stopReceiving) return stopReceiving

  const unsubscribeSession = subscribeToSessionChange((current) => {
    if (current) void activate()
    else deactivate()
  })
  // Статус инстанса из очереди: отключился — пауза (текущее событие дообработается и удалится).
  const unsubscribeState = useSessionStore.subscribe((state, previous) => {
    if (state.instanceState === previous.instanceState || !state.credentials) return
    if (state.instanceState !== null && !isUsableInstanceState(state.instanceState)) {
      enterDisconnected()
      return
    }
    if (useReceiveStore.getState().phase === ReceivePhase.InstanceDisconnected) void activate()
  })
  const handleOnline = () => {
    poller.wake()
  }
  window.addEventListener('online', handleOnline)
  if (getSessionCredentials()) void activate()

  stopReceiving = () => {
    unsubscribeSession()
    unsubscribeState()
    window.removeEventListener('online', handleOnline)
    deactivate()
    stopReceiving = null
  }
  return stopReceiving
}
