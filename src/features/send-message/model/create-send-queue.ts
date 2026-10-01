import type { SendFailure } from '@/entities/message/model/message.types'

import { ApiErrorKind, toApiError } from '@/shared/api/api-error'
import type { Credentials } from '@/shared/api/credentials'

type QueuedMessage = { chatId: string; text: string }

export type SendQueueDeps = {
  getCredentials: () => Credentials | null
  /** Сообщение, которое ещё ждёт отправки; null — его уже нет (например, после выхода). */
  getPendingMessage: (id: string) => QueuedMessage | null
  send: (
    credentials: Credentials,
    chatId: string,
    text: string,
    signal: AbortSignal,
  ) => Promise<string>
  onSent: (id: string, idMessage: string) => void
  onFailed: (id: string, failure: SendFailure | null, kind: ApiErrorKind) => void
}

export type SendQueue = {
  enqueue: (id: string) => void
  reset: () => void
}

/**
 * Очередь отправки: в полёте не больше одного sendMessage, порядок — порядок постановки.
 * Так получатель видит сообщения в том же порядке, в каком их написали.
 * `onFailed` получает `failure === null`, когда отправить нечем (нет сессии).
 */
export function createSendQueue(
  deps: SendQueueDeps,
  toFailure: (kind: ApiErrorKind) => SendFailure,
): SendQueue {
  const queue: string[] = []
  let active: { id: string; controller: AbortController } | null = null

  async function deliver(id: string, controller: AbortController) {
    const message = deps.getPendingMessage(id)
    if (!message) return
    const credentials = deps.getCredentials()
    if (!credentials) {
      deps.onFailed(id, null, ApiErrorKind.Unknown)
      return
    }
    try {
      const idMessage = await deps.send(
        credentials,
        message.chatId,
        message.text,
        controller.signal,
      )
      if (!controller.signal.aborted) deps.onSent(id, idMessage)
    } catch (error) {
      const { kind } = toApiError(error)
      if (kind === ApiErrorKind.Aborted || controller.signal.aborted) return
      deps.onFailed(id, toFailure(kind), kind)
    }
  }

  function pump() {
    if (active) return
    const id = queue.shift()
    if (id === undefined) return

    const controller = new AbortController()
    active = { id, controller }
    void deliver(id, controller).finally(() => {
      if (active?.controller !== controller) return
      active = null
      pump()
    })
  }

  return {
    enqueue: (id) => {
      if (active?.id === id || queue.includes(id)) return
      queue.push(id)
      pump()
    },
    reset: () => {
      queue.length = 0
      active?.controller.abort()
      active = null
    },
  }
}
