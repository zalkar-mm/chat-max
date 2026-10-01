import type { RawNotification } from '@/entities/notification/model/notification.types'

import { ApiErrorKind, toApiError } from '@/shared/api/api-error'

/** Пауза после сбоя: 1, 2, 4, 8, 16, 30, 30… с. */
export const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000] as const
const MAX_BACKOFF_MS = 30_000

/** Удаление не прошло — ещё столько попыток, потом идём дальше (дубль отсечёт idMessage). */
const DELETE_RETRIES = 3
const DELETE_RETRY_DELAY_MS = 500

export const backoffFor = (failures: number) => BACKOFF_MS[failures - 1] ?? MAX_BACKOFF_MS

export type PollerFailure = {
  failures: number
  retryInMs: number
  kind: ApiErrorKind
}

export type NotificationPollerDeps = {
  receive: (signal: AbortSignal) => Promise<RawNotification | null>
  remove: (receiptId: number, signal: AbortSignal) => Promise<boolean>
  /** Обработка события. Ошибка внутри не останавливает цикл: событие всё равно удаляется. */
  handle: (notification: RawNotification) => void
  onFailure: (failure: PollerFailure) => void
  onRecovered: () => void
  /** Креды больше не действуют: цикл остановлен, сессию надо завершить. */
  onUnauthorized: () => void
  /** Ошибка обработчика — только для логов разработки. */
  onHandleError?: (error: unknown) => void
}

export type NotificationPoller = {
  start: () => void
  /** Мягкая остановка: текущее событие дообрабатывается и удаляется, ожидание обрывается. */
  pause: () => void
  /** Жёсткая остановка (выход): все запросы отменяются. */
  stop: () => void
  /** Прервать паузу после сбоя и спросить очередь сразу (браузер вернулся онлайн). */
  wake: () => void
  isRunning: () => boolean
}

const isUnauthorized = (kind: ApiErrorKind) =>
  kind === ApiErrorKind.Unauthorized || kind === ApiErrorKind.Forbidden

/**
 * Цикл HTTP API получения: забрать → обработать → удалить → следующее.
 * Один экземпляр на сессию: повторный start работающего цикла — no-op.
 */
export function createNotificationPoller(deps: NotificationPollerDeps): NotificationPoller {
  let isRunning = false
  let generation = 0
  let receiveController: AbortController | null = null
  let removeController: AbortController | null = null
  let wakeUp: (() => void) | null = null
  let failures = 0

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(done, ms)
      function done() {
        clearTimeout(timer)
        wakeUp = null
        resolve()
      }
      wakeUp = done
    })

  async function removeNotification(receiptId: number, isCurrent: () => boolean) {
    for (let attempt = 0; attempt <= DELETE_RETRIES; attempt += 1) {
      removeController = new AbortController()
      try {
        await deps.remove(receiptId, removeController.signal)
        return
      } catch (error) {
        if (toApiError(error).kind === ApiErrorKind.Aborted || !isCurrent()) return
        await sleep(DELETE_RETRY_DELAY_MS)
        if (!isCurrent()) return
      } finally {
        removeController = null
      }
    }
  }

  async function loop(run: number) {
    const isCurrent = () => isRunning && generation === run
    while (isCurrent()) {
      receiveController = new AbortController()
      let notification: RawNotification | null
      try {
        notification = await deps.receive(receiveController.signal)
      } catch (error) {
        const { kind } = toApiError(error)
        if (kind === ApiErrorKind.Aborted || !isCurrent()) return
        if (isUnauthorized(kind)) {
          isRunning = false
          deps.onUnauthorized()
          return
        }
        failures += 1
        const retryInMs = backoffFor(failures)
        deps.onFailure({ failures, retryInMs, kind })
        await sleep(retryInMs)
        continue
      } finally {
        receiveController = null
      }

      if (failures > 0) {
        failures = 0
        deps.onRecovered()
      }
      if (notification === null) continue

      try {
        deps.handle(notification)
      } catch (error) {
        deps.onHandleError?.(error)
      }
      // Удаляем даже после мягкой паузы (обработчик мог поставить цикл на паузу): иначе событие придёт снова.
      await removeNotification(notification.receiptId, () => generation === run)
    }
  }

  return {
    start: () => {
      if (isRunning) return
      isRunning = true
      generation += 1
      void loop(generation)
    },
    pause: () => {
      isRunning = false
      receiveController?.abort()
      wakeUp?.()
    },
    stop: () => {
      isRunning = false
      generation += 1
      failures = 0
      receiveController?.abort()
      removeController?.abort()
      wakeUp?.()
    },
    wake: () => {
      wakeUp?.()
    },
    isRunning: () => isRunning,
  }
}
