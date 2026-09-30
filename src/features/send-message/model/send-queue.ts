import { touchChat } from '@/entities/chat/model/chat.store'
import { sendTextMessage } from '@/entities/message/api/send-text-message'
import { toSendFailure } from '@/entities/message/lib/to-send-failure'
import {
  addOutgoingMessage,
  getMessage,
  markMessageFailed,
  markMessageSending,
  markMessageSent,
} from '@/entities/message/model/message.store'
import type { MessageId } from '@/entities/message/model/message.types'
import { InstanceState } from '@/entities/session/model/instance-state'
import { getSessionCredentials, useSessionStore } from '@/entities/session/model/session.store'

import { ApiErrorKind, toApiError } from '@/shared/api/api-error'

export const MAX_MESSAGE_LENGTH = 4000

/**
 * Очередь отправки: в полёте не больше одного sendMessage, порядок — порядок ввода.
 * Так получатель видит сообщения в том же порядке, в каком их написали.
 */
const queue: MessageId[] = []
let active: { id: MessageId; controller: AbortController } | null = null

async function deliver(id: MessageId, controller: AbortController) {
  const message = getMessage(id)
  const credentials = getSessionCredentials()
  if (message?.direction !== 'outgoing' || !credentials) return

  try {
    const idMessage = await sendTextMessage(
      credentials,
      message.chatId,
      message.text,
      controller.signal,
    )
    markMessageSent(id, idMessage)
  } catch (error) {
    const { kind } = toApiError(error)
    if (kind === ApiErrorKind.Aborted) return
    markMessageFailed(id, toSendFailure(kind))
    // 403 при отправке — аккаунт ограничен: показываем жёлтый баннер спринта 1.
    if (kind === ApiErrorKind.Forbidden) {
      useSessionStore.getState().setInstanceState(InstanceState.Suspended)
    }
  }
}

function pump() {
  if (active) return
  const id = queue.shift()
  if (id === undefined) return

  const controller = new AbortController()
  active = { id, controller }
  void deliver(id, controller).finally(() => {
    if (active?.id === id) active = null
    if (!controller.signal.aborted) pump()
  })
}

function enqueue(id: MessageId) {
  queue.push(id)
  pump()
}

/** Сообщение сразу в ленте со статусом «отправляется», чат наверх, отправка — в очередь. */
export function sendMessage(chatId: string, text: string) {
  const message = addOutgoingMessage({ chatId, text: text.trim(), now: Date.now() })
  touchChat(chatId, message.createdAt)
  enqueue(message.id)
}

/** «Повторить»: то же сообщение снова «отправляется», на своём месте в ленте, без дубля. */
export function retryMessage(id: MessageId) {
  const message = getMessage(id)
  if (message?.direction !== 'outgoing' || message.delivery.status !== 'failed') return
  markMessageSending(id)
  enqueue(id)
}

export function resetSendQueue() {
  queue.length = 0
  active?.controller.abort()
  active = null
}

/** Запускается из app: выход из сессии обрывает очередь и запрос в полёте. */
export function startSendQueue() {
  const unsubscribe = useSessionStore.subscribe((state, previous) => {
    if (previous.credentials && !state.credentials) resetSendQueue()
  })
  return () => {
    unsubscribe()
    resetSendQueue()
  }
}
